import type { Review } from '../generated/prisma/client';
import { reviewRepository } from '../repositories/review.repository';
import { llmClient } from '../llm/client';

export const reviewService = {
   async getReviews(productId: number): Promise<Review[]> {
      return reviewRepository.getReviews(productId);
   },

   async summarizeReviews(productId: number): Promise<string> {
      // get last 10 (arbitrary value) reviews
      // send reviews to a LLM
      const reviews = await reviewRepository.getReviews(productId, 10);
      const joinedReviews = reviews.map((r) => r.content).join('\n\n');

      const prompt = `
      Summarize the following customer reviews into a short paragraph
      highlighting key themes, both positive and negative:

      ${joinedReviews}
      `;
      const response = await llmClient.generateText({
         model: 'gpt-4.1-nano-2025-04-14',
         prompt,
         temperature: 0.2,
         maxTokens: 500,
      });

      return response.text;
   },
};
