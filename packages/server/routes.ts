import express from 'express';
import type { Request, Response } from 'express';
import { chatController } from './controllers/chat.controller';
import { prisma } from './prisma/PrismaClient';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
   res.send('Salam Alaikum, Habibi');
});

router.post('/api/chat', chatController.sendMessage);

router.get('/api/products/:id/reviews', (req: Request, res: Response) => {});

export default router;
