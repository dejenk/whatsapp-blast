import logger from './logger.js';

// PHASE 3: Rate limiting per user (beyond global rate limit)

const userRequestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_USER = 30;

export const perUserRateLimit = async (request, reply) => {
  const userId = request.userId;
  
  if (!userId) {
    return;
  }

  const now = Date.now();
  const userKey = `user_${userId}`;
  
  if (!userRequestCounts.has(userKey)) {
    userRequestCounts.set(userKey, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  const userData = userRequestCounts.get(userKey);

  if (now > userData.resetAt) {
    userRequestCounts.set(userKey, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  userData.count++;

  if (userData.count > MAX_REQUESTS_PER_USER) {
    logger.warn({ userId, count: userData.count }, 'User rate limit exceeded');
    return reply.status(429).send({
      error: 'Too many requests',
      retryAfter: Math.ceil((userData.resetAt - now) / 1000),
    });
  }
};

setInterval(() => {
  const now = Date.now();
  for (const [key, data] of userRequestCounts.entries()) {
    if (now > data.resetAt) {
      userRequestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);
