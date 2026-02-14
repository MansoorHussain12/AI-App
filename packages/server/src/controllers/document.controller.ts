import fs from 'node:fs/promises';
import path from 'node:path';
import type { Response } from 'express';
import { prisma } from '../../prisma/PrismaClient';
import { config } from '../config';
import type { AuthRequest } from '../middleware/auth';
import { enqueueIngestion } from '../services/ingestion.service';
import { inferSourceType } from '../utils/extractors';

export async function uploadDocument(req: AuthRequest, res: Response) {
   const file = req.file;
   if (!file || !req.user)
      return res.status(400).json({ error: 'Missing file' });
   const sourceType = inferSourceType(file.originalname);
   const seedId = crypto.randomUUID();
   const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
   const finalDir = path.join(config.dataDir, 'uploads', seedId);
   await fs.mkdir(finalDir, { recursive: true });
   const finalPath = path.join(finalDir, safeName);
   await fs.rename(file.path, finalPath);

   const document = await prisma.document.create({
      data: {
         id: seedId,
         title: path.parse(file.originalname).name,
         originalName: file.originalname,
         storagePath: finalPath,
         sourceType,
         sizeBytes: file.size,
         createdById: req.user.userId,
         status: 'UPLOADED',
      },
   });
   await prisma.auditLog.create({
      data: {
         userId: req.user.userId,
         action: 'DOC_UPLOAD',
         metadata: JSON.stringify({ documentId: document.id }),
      },
   });
   await enqueueIngestion(document.id);
   return res.status(201).json({ documentId: document.id });
}

export async function listDocuments(_req: AuthRequest, res: Response) {
   const documents = await prisma.document.findMany({
      include: { ingestionJobs: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
   });
   res.json(documents);
}

export async function reindexDocument(req: AuthRequest, res: Response) {
   await enqueueIngestion(req.params.id);
   await prisma.document.update({
      where: { id: req.params.id },
      data: { status: 'UPLOADED' },
   });
   res.json({ ok: true });
}

export async function deleteDocument(req: AuthRequest, res: Response) {
   const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
   });
   if (!doc) return res.status(404).json({ error: 'Not found' });
   await fs.rm(path.dirname(doc.storagePath), { recursive: true, force: true });
   await prisma.document.delete({ where: { id: doc.id } });
   res.json({ ok: true });
}
