import { NextFunction, Request, Response } from 'express';
import { getNumberEnv } from '../utils/env';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export const createRateLimitMiddleware = ({
  windowMs,
  maxRequests,
}: RateLimitOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const current = rateLimitStore.get(key);

    if (!current || current.resetAt <= now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });

      return next();
    }

    if (current.count >= maxRequests) {
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
      });
    }

    current.count += 1;
    rateLimitStore.set(key, current);

    next();
  };
};

export const authRateLimit = createRateLimitMiddleware({
  windowMs: getNumberEnv('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  maxRequests: getNumberEnv('AUTH_RATE_LIMIT_MAX_REQUESTS', 20),
});
