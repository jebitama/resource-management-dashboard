import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RATE_LIMIT_CONFIG, type RateLimitType } from './lib';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://mock.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'mock-token',
});

// Cache instantiated limiters per serverless cold start
const limiters: Record<string, Ratelimit> = {};

export const applyRateLimit = async (
  req: VercelRequest, 
  res: VercelResponse, 
  type: RateLimitType = 'readAccess'
) => {
  if (!process.env.UPSTASH_REDIS_REST_URL) return true; // Skip if missing

  if (!limiters[type]) {
    limiters[type] = new Ratelimit({
      redis,
      limiter: RATE_LIMIT_CONFIG[type],
      analytics: true,
      prefix: `@upstash/ratelimit/${type}`
    });
  }

  const rateLimiter = limiters[type];
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';
  
  try {
    const { success, limit, remaining, reset } = await rateLimiter.limit(`ratelimit_${ip}`);
    
    res.setHeader(`X-RateLimit-Limit-${type}`, limit);
    res.setHeader(`X-RateLimit-Remaining-${type}`, remaining);
    res.setHeader(`X-RateLimit-Reset-${type}`, reset);

    if (!success) {
      res.status(429).json({ error: `Rate limit exceeded for ${type}. Too many requests to the enterprise API.` });
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Upstash rate limit error (${type}):`, err);
    return true; // Fail open if Redis is down
  }
};
