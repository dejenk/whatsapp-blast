import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino(
  isDev
    ? {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            singleLine: false,
            translateTime: 'SYS:standard',
          },
        },
      }
    : {
        level: process.env.LOG_LEVEL || 'info',
        // PHASE 2: Structured logging for production (ELK/Datadog compatible)
        base: {
          environment: process.env.NODE_ENV,
          service: 'whatsapp-blast-api',
          version: '1.0.0',
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }
);

export default logger;
