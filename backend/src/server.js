import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import logger from './utils/logger.js';
import { initDB } from './db/init.js';
import { initRedis } from './queue/redis.js';
import { authMiddleware } from './middleware/auth.js';
import { setupBlastProcessor, setupWebhookProcessor } from './workers/processors.js';
import { registerMetrics, metricsMiddleware } from './utils/metrics.js';
import campaignRoutes from './routes/campaigns.js';
import contactRoutes from './routes/contacts.js';
import messageRoutes from './routes/messages.js';
import webhookRoutes from './routes/webhook.js';
import analyticsRoutes from './routes/analytics.js';
import hermesRoutes from './routes/hermes.js';

const app = Fastify({ logger: true });

// PHASE 3: Security Headers
await app.register(helmet);

// PHASE 1: Rate limiting
await app.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes',
});

// CORS
await app.register(cors, { origin: process.env.CORS_ORIGIN || true });

// PHASE 2: Metrics middleware
registerMetrics();
app.addHook('preHandler', metricsMiddleware);

// Initialize Database & Redis
try {
  await initDB();
  await initRedis();
  logger.info('✅ Database & Redis initialized');
} catch (err) {
  logger.error(err, 'Failed to initialize services');
  process.exit(1);
}

// Setup job processors
try {
  await setupBlastProcessor();
  await setupWebhookProcessor();
  logger.info('✅ Job processors initialized');
} catch (err) {
  logger.error(err, 'Failed to initialize processors');
  process.exit(1);
}

// PHASE 4: Health checks
app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

app.get('/ready', async (request, reply) => {
  try {
    const db = require('./db/init.js').getDB();
    await db.query('SELECT 1');
    return { ready: true, timestamp: new Date().toISOString() };
  } catch (err) {
    logger.error(err, 'Readiness check failed');
    return reply.status(503).send({ ready: false, error: err.message });
  }
});

// PHASE 2: Metrics endpoint
app.get('/metrics', async (request, reply) => {
  try {
    const prometheus = require('prom-client');
    return reply.type('text/plain').send(await prometheus.register.metrics());
  } catch (err) {
    logger.error(err, 'Failed to get metrics');
    return reply.status(500).send({ error: 'Metrics unavailable' });
  }
});

// Webhook routes (special token-based auth)
app.register(webhookRoutes, { prefix: '/api/webhook' });

// Protected routes (require JWT auth)
app.register(async (fastify) => {
  // Add auth hook
  fastify.addHook('preHandler', authMiddleware);

  // Routes
  fastify.register(campaignRoutes, { prefix: '/api/campaigns' });
  fastify.register(contactRoutes, { prefix: '/api/contacts' });
  fastify.register(messageRoutes, { prefix: '/api/messages' });
  fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
  fastify.register(hermesRoutes, { prefix: '/api/hermes' });
});

// PHASE 1: Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.warn(`${signal} received, initiating graceful shutdown...`);
  
  try {
    // Stop accepting new connections
    await app.close();
    logger.info('✅ HTTP server closed');
    
    // Drain job queues
    const { blastQueue, webhookQueue } = require('./queue/redis.js');
    await blastQueue.drain();
    await webhookQueue.drain();
    logger.info('✅ Job queues drained');
    
    process.exit(0);
  } catch (err) {
    logger.error(err, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  logger.error(err, '💥 Uncaught exception');
  process.exit(1);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, '💥 Unhandled promise rejection');
});

// Start Server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    const host = '0.0.0.0';
    await app.listen({ port, host });
    logger.info(`🚀 Server running on http://${host}:${port}`);
    logger.info(`📊 Metrics: http://${host}:${port}/metrics`);
    logger.info(`🏥 Health: http://${host}:${port}/health`);
    logger.info(`✅ Ready: http://${host}:${port}/ready`);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
};

start();

export default app;
