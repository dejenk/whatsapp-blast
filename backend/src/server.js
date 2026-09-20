import Fastify from 'fastify';
import cors from '@fastify/cors';
import logger from './utils/logger.js';
import { initDB } from './db/init.js';
import { initRedis } from './queue/redis.js';
import campaignRoutes from './routes/campaigns.js';
import contactRoutes from './routes/contacts.js';
import messageRoutes from './routes/messages.js';
import webhookRoutes from './routes/webhook.js';
import analyticsRoutes from './routes/analytics.js';
import hermesRoutes from './routes/hermes.js';

const app = Fastify({ logger: true });

// Middleware
await app.register(cors, { origin: true });

// Initialize Database & Redis
try {
  await initDB();
  await initRedis();
  logger.info('Database & Redis initialized');
} catch (err) {
  logger.error(err, 'Failed to initialize services');
  process.exit(1);
}

// Routes
app.register(campaignRoutes, { prefix: '/api/campaigns' });
app.register(contactRoutes, { prefix: '/api/contacts' });
app.register(messageRoutes, { prefix: '/api/messages' });
app.register(webhookRoutes, { prefix: '/api/webhook' });
app.register(analyticsRoutes, { prefix: '/api/analytics' });
app.register(hermesRoutes, { prefix: '/api/hermes' });

// Health Check
app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start Server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    const host = '0.0.0.0';
    await app.listen({ port, host });
    logger.info(`Server running on ${host}:${port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
