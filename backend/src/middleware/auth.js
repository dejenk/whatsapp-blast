import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const signToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    logger.error(err, 'Invalid token');
    throw new Error('Invalid token');
  }
};

export const authMiddleware = async (request, reply) => {
  try {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return reply.status(401).send({ error: 'Missing authorization header' });
    }

    const token = authorization.replace('Bearer ', '');
    if (!token) {
      return reply.status(401).send({ error: 'Invalid authorization header' });
    }

    const decoded = verifyToken(token);
    request.userId = decoded.userId;
  } catch (err) {
    logger.error(err, 'Auth middleware failed');
    return reply.status(401).send({ error: 'Unauthorized' });
  }
};
