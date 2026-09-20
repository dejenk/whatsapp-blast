import axios from 'axios';
import logger from './logger.js';

// PHASE 1: Exponential Backoff for API calls

export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      
      if (attempt === maxRetries) {
        logger.error(err, `Max retries (${maxRetries}) exceeded`);
        throw err;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;

      logger.warn(
        { attempt: attempt + 1, maxRetries, delay: totalDelay },
        `Retry attempt ${attempt + 1}/${maxRetries} after ${totalDelay}ms`
      );

      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
};

export const axiosWithRetry = async (config, maxRetries = 3) => {
  return retryWithBackoff(async () => {
    const response = await axios(config);
    return response;
  }, maxRetries);
};

export const sendWhatsAppMessageWithRetry = async (phoneNumber, messageText) => {
  return retryWithBackoff(async () => {
    const response = await axios.post(
      `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber.replace(/\D/g, ''),
        type: 'text',
        text: { body: messageText },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    return response;
  }, 3, 1000);
};
