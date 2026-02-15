import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../../prisma/PrismaClient';
import { config } from '../config';
import {
   deleteDocumentVectors,
   ingestDocument,
} from './rag/llamaindex.service';

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
            data: { status: 'RUNNING', stage: 'EXTRACT', progress: 5 },
         });

         const doc = await prisma.document.findUniqueOrThrow({
            where: { id: job.documentId },
         });

         await prisma.document.update({
            where: { id: doc.id },
            data: { status: 'PROCESSING', errorMessage: null },
         });

         await ingestDocument(
            {
               documentId: doc.id,
               filePath: doc.storagePath,
               sourceType: doc.sourceType,
               title: doc.title,
            },
            job.id
         );
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

export async function removeDocumentFromIndex(documentId: string) {
   await deleteDocumentVectors(documentId);
}

export async function ensureDataDirectories() {
   await fs.mkdir(path.join(config.dataDir, 'uploads'), { recursive: true });
   await fs.mkdir(path.join(config.dataDir, 'qdrant'), { recursive: true });
}
