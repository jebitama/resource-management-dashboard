import { Ratelimit } from '@upstash/ratelimit';

export const RATE_LIMIT_CONFIG = {
  readAccess: Ratelimit.slidingWindow(20, '1 m'),
  writeAccess: Ratelimit.slidingWindow(10, '1 m'),
  authAccess: Ratelimit.slidingWindow(5, '1 m'),
  jobAccess: Ratelimit.slidingWindow(2, '1 m'),
};

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;
