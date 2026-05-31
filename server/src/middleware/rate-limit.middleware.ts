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
      const resetAt = now + windowMs;

      rateLimitStore.set(key, {
        count: 1,
        resetAt,
      });

      res.setHeader('RateLimit-Limit', maxRequests.toString());
      res.setHeader('RateLimit-Remaining', (maxRequests - 1).toString());
      res.setHeader('RateLimit-Reset', Math.ceil(resetAt / 1000).toString());

      return next();
    }

    const remaining = Math.max(maxRequests - current.count, 0);
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);

    res.setHeader('RateLimit-Limit', maxRequests.toString());
    res.setHeader('RateLimit-Remaining', remaining.toString());
    res.setHeader('RateLimit-Reset', Math.ceil(current.resetAt / 1000).toString());

    if (current.count >= maxRequests) {
      res.setHeader('Retry-After', retryAfterSeconds.toString());

      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfterSeconds,
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
