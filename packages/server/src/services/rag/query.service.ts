import { config } from '../../config';
import { chatWithProvider, embedWithProvider } from '../model-gateway.service';
import { getEffectiveProvider } from '../provider-config.service';
import { searchQdrant } from './qdrant.service';

type QueryParams = {
   userId: string;
   question: string;
   docIds?: string[];
};

type RetrievedChunk = {
   id: string;
   score: number;
   payload: Record<string, unknown>;
};

const STOPWORDS = new Set([
   'the',
   'a',
   'an',
   'is',
   'are',
   'for',
   'to',
   'of',
   'in',
   'on',
   'and',
   'or',
   'what',
   'how',
   'where',
   'when',
   'why',
]);

function normalizeQuestion(question: string) {
   return question.replace(/\s+/g, ' ').trim();
}

function extractKeywords(question: string) {
   return normalizeQuestion(question)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function overlapScore(keywords: string[], text: string) {
   if (!keywords.length) return 0;
   const lower = text.toLowerCase();
   const matches = keywords.filter((keyword) => lower.includes(keyword)).length;
   return matches / keywords.length;
}

function dedupeByContent(chunks: RetrievedChunk[]) {
   const seen = new Set<string>();
   const deduped: RetrievedChunk[] = [];
   for (const chunk of chunks) {
      const key = String(chunk.payload.content ?? '').slice(0, 250);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(chunk);
   }
   return deduped;
}

export async function answerWithQueryPipeline({
   userId,
   question,
   docIds,
}: QueryParams) {
   const timings: Record<string, number> = {};
   const started = Date.now();
   const normalizedQuestion = normalizeQuestion(question);
   const keywords = extractKeywords(normalizedQuestion);

   const effective = await getEffectiveProvider(userId);

   const embedStart = Date.now();
   const queryEmbedding = await embedWithProvider(
      normalizedQuestion,
      effective.embedProvider
   );
   timings.embedMs = Date.now() - embedStart;

   const qdrantStart = Date.now();
   const filter = docIds?.length
      ? {
           should: docIds.map((id) => ({
              key: 'documentId',
              match: { value: id },
           })),
        }
      : undefined;

   const retrieved = await searchQdrant(queryEmbedding, 16, filter);
   timings.qdrantMs = Date.now() - qdrantStart;

   const enriched = retrieved.map((item) => {
      const content = String(item.payload.content ?? '');
      const lexical = overlapScore(keywords, content);
      const combined = 0.7 * item.score + 0.3 * lexical;
      return {
         ...item,
         lexical,
         combined,
      };
   });

   const answerability = enriched.length
      ? Math.max(...enriched.map((item) => item.lexical))
      : 0;

   if (answerability < config.ragMinAnswerability) {
      return {
         answer: 'I can’t find this in the provided documents.',
         citations: [],
         debug: {
            answerability,
            timings,
            retrieval: enriched.slice(0, 5).map((r) => ({
               title: r.payload.title,
               score: r.score,
               lexical: r.lexical,
            })),
         },
      };
   }

   const rerankStart = Date.now();
   const reranked = dedupeByContent(
      [...enriched]
         .sort((a, b) => b.combined - a.combined)
         .slice(0, config.ragMaxCitations)
   );
   timings.rerankMs = Date.now() - rerankStart;

   if (
      effective.llmProvider === 'HF_REMOTE' &&
      !effective.config.allowRemoteHfContext
   ) {
      return {
         answer:
            'Remote provider is selected, but remote context sharing is disabled by policy. Switch provider or ask without document context.',
         citations: reranked.map((chunk) => ({
            chunkId: String(chunk.payload.chunkId ?? chunk.id),
            docId: String(chunk.payload.documentId ?? ''),
            title: String(chunk.payload.title ?? 'Unknown'),
            pageOrSlide: chunk.payload.pageNumber
               ? `Page ${String(chunk.payload.pageNumber)}`
               : chunk.payload.slideNumber
                 ? `Slide ${String(chunk.payload.slideNumber)}`
                 : 'N/A',
            snippet: String(chunk.payload.content ?? '').slice(0, 180),
            score: chunk.combined,
         })),
         debug: {
            answerability,
            timings,
            remoteContextBlocked: true,
         },
      };
   }

   let context = '';
   const contextChunks: RetrievedChunk[] = [];
   for (const chunk of reranked) {
      const section = `[${contextChunks.length + 1}] ${String(chunk.payload.title ?? 'Untitled')} (${chunk.payload.pageNumber ? `page ${String(chunk.payload.pageNumber)}` : chunk.payload.slideNumber ? `slide ${String(chunk.payload.slideNumber)}` : 'document'})\n${String(chunk.payload.content ?? '')}\n\n`;
      if (context.length + section.length > config.ragContextMaxChars) break;
      context += section;
      contextChunks.push(chunk);
   }

   const generateStart = Date.now();
   const answer = await chatWithProvider(
      [
         {
            role: 'system',
            content:
               'You are a factory assistant. Answer ONLY from CONTEXT. If unsupported, respond exactly: I can’t find this in the provided documents.',
         },
         {
            role: 'user',
            content: `Question: ${normalizedQuestion}\n\nCONTEXT:\n${context}\n\nReturn concise answer and cite supporting chunks by bracket numbers.`,
         },
      ],
      effective.llmProvider
   );
   timings.generationMs = Date.now() - generateStart;

   const citations = contextChunks.map((chunk) => ({
      chunkId: String(chunk.payload.chunkId ?? chunk.id),
      docId: String(chunk.payload.documentId ?? ''),
      title: String(chunk.payload.title ?? 'Unknown'),
      pageOrSlide: chunk.payload.pageNumber
         ? `Page ${String(chunk.payload.pageNumber)}`
         : chunk.payload.slideNumber
           ? `Slide ${String(chunk.payload.slideNumber)}`
           : 'N/A',
      snippet: String(chunk.payload.content ?? '').slice(0, 180),
      score: chunk.combined,
   }));

   timings.totalMs = Date.now() - started;

   return {
      answer,
      citations,
      debug: {
         answerability,
         timings,
         contextCharCount: context.length,
         chunksIncluded: contextChunks.length,
         llmProvider: effective.llmProvider,
         embedProvider: effective.embedProvider,
      },
   };
}
