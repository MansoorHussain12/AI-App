import { prisma } from '../../../prisma/PrismaClient';
import { config } from '../../config';
import { chunkBlocks } from '../../utils/chunker';
import { extractDocument } from '../../utils/extractors';
import { getProviderConfig } from '../provider-config.service';
import { embedWithProvider } from '../model-gateway.service';
import {
   deleteQdrantByDocument,
   ensureQdrantCollection,
   upsertQdrantPoints,
} from './qdrant.service';

type IngestParams = {
   documentId: string;
   filePath: string;
   sourceType: string;
   title: string;
};

async function maybeBuildLlamaDocuments(
   chunks: Array<{
      content: string;
      chunkIndex: number;
      pageNumber?: number;
      slideNumber?: number;
   }>,
   metadata: { documentId: string; title: string; sourceType: string }
) {
   try {
      const llama = (await import('llamaindex')) as any;
      return chunks.map(
         (chunk) =>
            new llama.Document({
               text: chunk.content,
               metadata: {
                  ...metadata,
                  chunkIndex: chunk.chunkIndex,
                  pageNumber: chunk.pageNumber,
                  slideNumber: chunk.slideNumber,
               },
            })
      );
   } catch {
      return chunks.map((chunk) => ({
         text: chunk.content,
         metadata: {
            ...metadata,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            slideNumber: chunk.slideNumber,
         },
      }));
   }
}

export async function ingestDocument(params: IngestParams, jobId: string) {
   await prisma.ingestionJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', stage: 'EXTRACT', progress: 10 },
   });

   const blocks = await extractDocument(params.filePath, params.sourceType);

   await prisma.ingestionJob.update({
      where: { id: jobId },
      data: { stage: 'CHUNK', progress: 30 },
   });

   const chunks = chunkBlocks(blocks, config.chunkSize, config.chunkOverlap);

   await maybeBuildLlamaDocuments(chunks, {
      documentId: params.documentId,
      title: params.title,
      sourceType: params.sourceType,
   });

   await deleteQdrantByDocument(params.documentId);
   await prisma.documentChunk.deleteMany({
      where: { documentId: params.documentId },
   });

   await prisma.ingestionJob.update({
      where: { id: jobId },
      data: { stage: 'EMBED', progress: 50 },
   });

   const providerConfig = await getProviderConfig();
   const vectors: number[][] = [];

   for (const chunk of chunks) {
      vectors.push(
         await embedWithProvider(
            chunk.content,
            providerConfig.defaultEmbedProvider
         )
      );
   }

   if (vectors.length) {
      await ensureQdrantCollection(vectors[0].length);
   }

   await prisma.ingestionJob.update({
      where: { id: jobId },
      data: { stage: 'UPSERT', progress: 75 },
   });

   const qdrantPoints: Array<{
      id: string;
      vector: number[];
      payload: Record<string, unknown>;
   }> = [];

   for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const vector = vectors[index];
      const chunkId = `${params.documentId}_${chunk.chunkIndex}`;

      await prisma.documentChunk.create({
         data: {
            id: chunkId,
            documentId: params.documentId,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            embedding: JSON.stringify(vector),
            pageNumber: chunk.pageNumber,
            slideNumber: chunk.slideNumber,
         },
      });

      qdrantPoints.push({
         id: chunkId,
         vector,
         payload: {
            chunkId,
            documentId: params.documentId,
            title: params.title,
            sourceType: params.sourceType,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber ?? null,
            slideNumber: chunk.slideNumber ?? null,
            content: chunk.content,
            createdAt: new Date().toISOString(),
         },
      });
   }

   if (qdrantPoints.length) {
      await upsertQdrantPoints(qdrantPoints);
   }

   await prisma.document.update({
      where: { id: params.documentId },
      data: { status: 'INDEXED', errorMessage: null },
   });

   await prisma.ingestionJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', stage: 'DONE', progress: 100 },
   });
}

export async function deleteDocumentVectors(documentId: string) {
   await deleteQdrantByDocument(documentId);
   await prisma.documentChunk.deleteMany({ where: { documentId } });
}

export async function reindexDocumentVectors(
   params: IngestParams,
   jobId: string
) {
   await deleteDocumentVectors(params.documentId);
   await ingestDocument(params, jobId);
}
