import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://mock.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'mock-token',
});

const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
});

export const applyRateLimit = async (req: VercelRequest, res: VercelResponse) => {
  if (!process.env.UPSTASH_REDIS_REST_URL) return true; // Skip if missing

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';
  try {
    const { success, limit, remaining, reset } = await rateLimiter.limit(`ratelimit_${ip}`);
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);

    if (!success) {
      res.status(429).json({ error: 'Rate limit exceeded. Too many requests to the enterprise API.' });
      return false;
    }
    return true;
  } catch (err) {
    console.error('Upstash rate limit error:', err);
    return true; // Fail open if Redis is down
  }
};
