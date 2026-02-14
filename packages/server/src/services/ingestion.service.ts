import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../../prisma/PrismaClient';
import { config } from '../config';
import { chunkBlocks } from '../utils/chunker';
import { extractDocument } from '../utils/extractors';
import { embed } from './ollama.service';

let workerRunning = false;

export async function enqueueIngestion(documentId: string) {
   await prisma.ingestionJob.create({
      data: { documentId, status: 'PENDING', stage: 'QUEUED' },
   });
   if (!workerRunning) void runWorker();
}

async function runWorker() {
   workerRunning = true;
   while (true) {
      const job = await prisma.ingestionJob.findFirst({
         where: { status: 'PENDING' },
         orderBy: { createdAt: 'asc' },
      });
      if (!job) break;
      try {
         await prisma.ingestionJob.update({
            where: { id: job.id },
            data: { status: 'RUNNING', stage: 'EXTRACTING', progress: 10 },
         });
         await prisma.document.update({
            where: { id: job.documentId },
            data: { status: 'PROCESSING', errorMessage: null },
         });
         const doc = await prisma.document.findUniqueOrThrow({
            where: { id: job.documentId },
         });
         const blocks = await extractDocument(doc.storagePath, doc.sourceType);
         await prisma.ingestionJob.update({
            where: { id: job.id },
            data: { stage: 'CHUNKING', progress: 35 },
         });
         const chunks = chunkBlocks(
            blocks,
            config.chunkSize,
            config.chunkOverlap
         );
         await prisma.documentChunk.deleteMany({
            where: { documentId: doc.id },
         });
         await prisma.ingestionJob.update({
            where: { id: job.id },
            data: { stage: 'EMBEDDING', progress: 55 },
         });

         for (let i = 0; i < chunks.length; i += 1) {
            const c = chunks[i];
            const vector = await embed(c.content);
            await prisma.documentChunk.create({
               data: {
                  documentId: doc.id,
                  chunkIndex: c.chunkIndex,
                  content: c.content,
                  embedding: JSON.stringify(vector),
                  pageNumber: c.pageNumber,
                  slideNumber: c.slideNumber,
               },
            });
            const progress = Math.min(
               95,
               55 + Math.round((i / Math.max(chunks.length, 1)) * 40)
            );
            await prisma.ingestionJob.update({
               where: { id: job.id },
               data: { progress },
            });
         }

         await prisma.document.update({
            where: { id: doc.id },
            data: { status: 'INDEXED' },
         });
         await prisma.ingestionJob.update({
            where: { id: job.id },
            data: { status: 'COMPLETED', stage: 'DONE', progress: 100 },
         });
      } catch (error) {
         const message =
            error instanceof Error ? error.message : 'Unknown ingestion error';
         await prisma.ingestionJob.update({
            where: { id: job.id },
            data: { status: 'FAILED', stage: 'FAILED', error: message },
         });
         await prisma.document.update({
            where: { id: job.documentId },
            data: { status: 'FAILED', errorMessage: message },
         });
      }
   }
   workerRunning = false;
}

export async function ensureDataDirectories() {
   await fs.mkdir(path.join(config.dataDir, 'uploads'), { recursive: true });
}
