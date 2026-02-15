import { describe, expect, it } from 'bun:test';
import fs from 'node:fs/promises';
import path from 'node:path';

const enabled = process.env.RUN_RAG_E2E === '1';

describe('rag e2e (qdrant-backed)', () => {
   it('returns citations for answerable and refusal for unanswerable', async () => {
      if (!enabled) return;

      const { prisma } = await import('../prisma/PrismaClient');
      const { answerWithQueryPipeline } =
         await import('../src/services/rag/query.service');
      const { ensureQdrantCollection, upsertQdrantPoints } =
         await import('../src/services/rag/qdrant.service');

      const q = JSON.parse(
         await fs.readFile(
            path.join(import.meta.dir, 'fixtures', 'questions.json'),
            'utf8'
         )
      ) as {
         answerable: { question: string };
         unanswerable: { question: string };
      };

      const user = await prisma.user.upsert({
         where: { username: 'rag-e2e-user' },
         update: {},
         create: {
            username: 'rag-e2e-user',
            passwordHash: 'x',
            role: 'ADMIN',
         },
      });

      const doc = await prisma.document.create({
         data: {
            title: 'RAG E2E Fixture',
            originalName: 'fixture.docx',
            storagePath: '/tmp/fixture.docx',
            sourceType: 'docx',
            sizeBytes: 100,
            createdById: user.id,
            status: 'INDEXED',
         },
      });

      const fixtureText =
         'Lockout tagout procedure: isolate all energy sources, apply lockout devices, verify zero energy state, then perform maintenance.';

      await ensureQdrantCollection(8);
      await upsertQdrantPoints([
         {
            id: `${doc.id}_0`,
            vector: [0.8, 0.4, 0.3, 0.2, 0.6, 0.1, 0.5, 0.2],
            payload: {
               chunkId: `${doc.id}_0`,
               documentId: doc.id,
               title: doc.title,
               sourceType: 'docx',
               chunkIndex: 0,
               pageNumber: null,
               slideNumber: null,
               content: fixtureText,
               createdAt: new Date().toISOString(),
            },
         },
      ]);

      await prisma.documentChunk.create({
         data: {
            id: `${doc.id}_0`,
            documentId: doc.id,
            chunkIndex: 0,
            content: fixtureText,
            embedding: JSON.stringify([0.8, 0.4, 0.3, 0.2, 0.6, 0.1, 0.5, 0.2]),
         },
      });

      const answerable = await answerWithQueryPipeline({
         userId: user.id,
         question: q.answerable.question,
         docIds: [doc.id],
      });
      expect(answerable.citations.length).toBeGreaterThan(0);

      const unanswerable = await answerWithQueryPipeline({
         userId: user.id,
         question: q.unanswerable.question,
         docIds: [doc.id],
      });
      expect(unanswerable.answer.toLowerCase()).toContain('can’t find');
      expect(unanswerable.citations.length).toBe(0);
   });
});
