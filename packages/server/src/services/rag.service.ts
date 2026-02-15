import { answerWithQueryPipeline } from './rag/query.service';

export async function answerWithRag(
   question: string,
   userId: string,
   docIds?: string[]
) {
   return answerWithQueryPipeline({
      userId,
      question,
      docIds,
   });
}
