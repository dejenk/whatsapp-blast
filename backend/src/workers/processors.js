import axios from 'axios';
import { getDB } from '../db/init.js';
import { blastQueue, webhookQueue } from '../queue/redis.js';
import logger from '../utils/logger.js';

/**
 * Process send-campaign jobs
 */
export const setupBlastProcessor = async () => {
  blastQueue.process('send-campaign', 3, async (job) => {
    try {
      const { campaign_id } = job.data;
      const db = getDB();

      const campaignResult = await db.query(
        'SELECT * FROM campaigns WHERE id = $1',
        [campaign_id]
      );
      const campaign = campaignResult.rows[0];

      if (!campaign) {
        throw new Error(`Campaign ${campaign_id} not found`);
      }

      const contactsResult = await db.query(
        `SELECT c.* FROM contacts c
         WHERE c.id IN (
           SELECT DISTINCT contact_id FROM messages WHERE campaign_id = $1
         )`,
        [campaign_id]
      );
      const contacts = contactsResult.rows;

      logger.info(`Processing campaign ${campaign_id} with ${contacts.length} contacts`);

      let sentCount = 0;
      let failedCount = 0;

      for (const contact of contacts) {
        try {
          const response = await axios.post(
            `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_ID}/messages`,
            {
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: contact.phone_number.replace(/\D/g, ''),
              type: 'text',
              text: { body: campaign.name },
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            }
          );

          const wa_message_id = response.data.messages[0].id;

          await db.query(
            'UPDATE messages SET wa_message_id = $1, status = $2, sent_at = NOW() WHERE campaign_id = $3 AND contact_id = $4',
            [wa_message_id, 'sent', campaign_id, contact.id]
          );

          sentCount++;
          job.progress((sentCount / contacts.length) * 100);
        } catch (err) {
          logger.error(err, `Failed to send message to ${contact.phone_number}`);
          failedCount++;

          await db.query(
            'UPDATE messages SET status = $1, error_message = $2 WHERE campaign_id = $3 AND contact_id = $4',
            ['failed', err.message, campaign_id, contact.id]
          );
        }
      }

      await db.query(
        'UPDATE campaigns SET sent_count = $1, failed_count = $2, status = $3, ended_at = NOW() WHERE id = $4',
        [sentCount, failedCount, 'completed', campaign_id]
      );

      logger.info(`Campaign ${campaign_id} completed: ${sentCount} sent, ${failedCount} failed`);
      return { sentCount, failedCount };
    } catch (err) {
      logger.error(err, 'Blast processor error');
      throw err;
    }
  });
};

/**
 * Process webhook events
 */
export const setupWebhookProcessor = async () => {
  webhookQueue.process('process-webhook', 5, async (job) => {
    try {
      const { event } = job.data;
      const db = getDB();

      logger.info({ event }, 'Processing webhook event');

      if (event.statuses) {
        for (const status of event.statuses) {
          await db.query(
            `UPDATE messages SET status = $1, delivered_at = NOW() WHERE wa_message_id = $2`,
            [status.status, status.id]
          );
        }
      }

      if (event.messages) {
        for (const msg of event.messages) {
          await db.query(
            `INSERT INTO messages (phone_number, message_type, content, wa_message_id, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
            [msg.from, msg.type, msg.text?.body || '', msg.id, 'received']
          );
        }
      }

      return { processed: true };
    } catch (err) {
      logger.error(err, 'Webhook processor error');
      throw err;
    }
  });
};

blastQueue.on('failed', (job, err) => {
  logger.error({ jobId: job.id, err }, 'Blast job failed');
});

webhookQueue.on('failed', (job, err) => {
  logger.error({ jobId: job.id, err }, 'Webhook job failed');
});
