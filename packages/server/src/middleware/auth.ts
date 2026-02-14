import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

type JwtPayload = { userId: string; role: 'ADMIN' | 'USER' };

export type AuthRequest = Request & { user?: JwtPayload };

export function requireAuth(
   req: AuthRequest,
   res: Response,
   next: NextFunction
) {
   const header = req.headers.authorization;
   if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
   }
   try {
      req.user = jwt.verify(header.slice(7), config.jwtSecret) as JwtPayload;
      return next();
   } catch {
      return res.status(401).json({ error: 'Invalid token' });
   }
}

export function requireAdmin(
   req: AuthRequest,
   res: Response,
   next: NextFunction
) {
   if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
   }
   return next();
}
