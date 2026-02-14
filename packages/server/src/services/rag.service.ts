import { prisma } from '../../prisma/PrismaClient';
import { config } from '../config';
import {
   chatWithProvider,
   embedWithProvider,
   type ChatMessage,
} from './model-gateway.service';
import { getEffectiveProvider } from './provider-config.service';

const SYSTEM_PROMPT = `You are a factory RAG assistant. Use only provided context. If evidence is missing, say you could not find it. Do not fabricate SOP or policy details. Keep answers concise and procedural. Ask clarifying questions when the query is ambiguous.`;

type Citation = {
   docId: string;
   title: string;
   pageOrSlide: string;
   snippet: string;
   chunkId: string;
   score: number;
};

export async function answerWithRag(
   question: string,
   userId: string,
   docIds?: string[]
) {
   const {
      llmProvider,
      embedProvider,
      config: providerConfig,
   } = await getEffectiveProvider(userId);

   const queryEmbedding = await embedWithProvider(question, embedProvider);
   const where = docIds?.length ? { documentId: { in: docIds } } : undefined;
   const chunks = await prisma.documentChunk.findMany({
      where,
      include: { document: true },
   });

   const scored = chunks
      .map((chunk) => {
         const vector = JSON.parse(chunk.embedding) as number[];
         const score = cosine(queryEmbedding, vector);
         return { chunk, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, config.topK);

   const top3 = scored.slice(0, 3);
   const confidence =
      top3.reduce((sum, item) => sum + item.score, 0) /
      Math.max(top3.length, 1);

   if (!scored.length || confidence < config.minSimilarity) {
      return {
         answer:
            "I couldn't find this in the indexed documents. Try different keywords or upload the relevant SOP/work instruction.",
         citations: [] as Citation[],
         debug: {
            retrievalScores: scored.map((s) => s.score),
            usedChunksCount: 0,
            confidence,
            llmProvider,
            embedProvider,
         },
      };
   }

   const citations: Citation[] = scored.slice(0, 4).map(({ chunk, score }) => ({
      docId: chunk.documentId,
      title: chunk.document.title,
      pageOrSlide: chunk.pageNumber
         ? `Page ${chunk.pageNumber}`
         : chunk.slideNumber
           ? `Slide ${chunk.slideNumber}`
           : 'N/A',
      snippet: chunk.content.slice(0, 180),
      chunkId: chunk.id,
      score,
   }));

   if (llmProvider === 'HF_REMOTE' && !providerConfig.allowRemoteHfContext) {
      return {
         answer:
            'Hugging Face remote is selected, but sending document context is disabled by admin policy. Switch to Ollama or ask a general question without document context.',
         citations,
         debug: {
            retrievalScores: scored.map((s) => s.score),
            usedChunksCount: scored.length,
            confidence,
            llmProvider,
            embedProvider,
            remoteContextBlocked: true,
         },
      };
   }

   const context = scored
      .map(
         (s, i) =>
            `[${i + 1}] ${s.chunk.document.title} (${s.chunk.pageNumber ? `page ${s.chunk.pageNumber}` : s.chunk.slideNumber ? `slide ${s.chunk.slideNumber}` : 'document'})\n${s.chunk.content}`
      )
      .join('\n\n');

   const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
         role: 'user',
         content: `Question: ${question}\n\nContext:\n${context}\n\nFormat response with concise answer then Sources.`,
      },
   ];

   const answer = await chatWithProvider(messages, llmProvider);

   return {
      answer,
      citations,
      debug: {
         retrievalScores: scored.map((s) => s.score),
         usedChunksCount: scored.length,
         confidence,
         llmProvider,
         embedProvider,
      },
   };
}

function cosine(a: number[], b: number[]) {
   let dot = 0;
   let normA = 0;
   let normB = 0;
   const len = Math.min(a.length, b.length);
   for (let i = 0; i < len; i += 1) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
   }
   return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}
