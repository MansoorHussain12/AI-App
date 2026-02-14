import type { NextFunction, Response } from 'express';
import type { AuthRequest } from './auth';
import { config } from '../config';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(req: AuthRequest, res: Response, next: NextFunction) {
   const key = req.user?.userId ?? req.ip;
   const now = Date.now();
   const bucket = buckets.get(key!);
   if (!bucket || bucket.resetAt < now) {
      buckets.set(key!, { count: 1, resetAt: now + 60_000 });
      return next();
   }
   if (bucket.count >= config.rateLimitPerMinute) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
   }
   bucket.count += 1;
   return next();
}
