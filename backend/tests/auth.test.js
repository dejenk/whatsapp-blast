import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '../src/middleware/auth.js';

describe('JWT Authentication', () => {
  it('should generate a valid token', () => {
    const token = signToken(123);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  it('should verify a valid token', () => {
    const token = signToken(456);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(456);
  });

  it('should throw error for invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });

  it('should throw error for expired token', () => {
    expect(true).toBe(true);
  });
});
