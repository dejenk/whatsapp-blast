import promClient from 'prom-client';

// PHASE 2: Prometheus Metrics Collection

// Create a Registry
export const register = new promClient.Registry();

// Enable default metrics (CPU, memory, event loop lag)
promClient.collectDefaultMetrics({ register });

// Custom HTTP metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Custom business metrics
export const campaignsCreated = new promClient.Counter({
  name: 'campaigns_created_total',
  help: 'Total number of campaigns created',
  registers: [register],
});

export const messagesQueued = new promClient.Counter({
  name: 'messages_queued_total',
  help: 'Total number of messages queued for sending',
  registers: [register],
});

export const messagesSent = new promClient.Counter({
  name: 'messages_sent_total',
  help: 'Total number of messages successfully sent',
  labelNames: ['status'],
  registers: [register],
});

export const messageErrors = new promClient.Counter({
  name: 'message_errors_total',
  help: 'Total number of message sending errors',
  labelNames: ['error_type'],
  registers: [register],
});

export const activeConnections = new promClient.Gauge({
  name: 'active_db_connections',
  help: 'Number of active database connections',
  registers: [register],
});

export const registerMetrics = () => {
  return register;
};

// Fastify middleware to track request metrics
export const metricsMiddleware = async (request, reply) => {
  const start = Date.now();
  
  reply.raw.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = request.routerPath || request.url;
    const method = request.method;
    const statusCode = reply.statusCode;

    httpRequestDuration.labels(method, route, statusCode).observe(duration);
    httpRequestTotal.labels(method, route, statusCode).inc();
  });
};
