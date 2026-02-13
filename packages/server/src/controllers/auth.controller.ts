import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/PrismaClient';
import { config } from '../config';

export async function login(req: Request, res: Response) {
   const { username, password } = req.body as {
      username: string;
      password: string;
   };
   const user = await prisma.user.findUnique({ where: { username } });
   if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
   }
   const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: '12h' }
   );
   return res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
   });
}
