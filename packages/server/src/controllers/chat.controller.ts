import type { Response } from 'express';
import { prisma } from '../../prisma/PrismaClient';
import type { AuthRequest } from '../middleware/auth';
import { answerWithRag } from '../services/rag.service';

export async function ragChat(req: AuthRequest, res: Response) {
   if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
   const { question, sessionId, docIds } = req.body as {
      question: string;
      sessionId?: string;
      docIds?: string[];
   };
   const session = sessionId
      ? await prisma.chatSession.findUnique({ where: { id: sessionId } })
      : await prisma.chatSession.create({
           data: { userId: req.user.userId, title: question.slice(0, 80) },
        });
   if (!session) return res.status(404).json({ error: 'Session not found' });

   await prisma.chatMessage.create({
      data: {
         sessionId: session.id,
         userId: req.user.userId,
         role: 'user',
         content: question,
      },
   });
   const rag = await answerWithRag(question, docIds);
   await prisma.chatMessage.create({
      data: {
         sessionId: session.id,
         userId: req.user.userId,
         role: 'assistant',
         content: rag.answer,
         citationsJson: JSON.stringify(rag.citations),
      },
   });
   await prisma.auditLog.create({
      data: {
         userId: req.user.userId,
         action: 'CHAT_QUERY',
         metadata: JSON.stringify({ sessionId: session.id }),
      },
   });
   res.json({ sessionId: session.id, ...rag });
}
