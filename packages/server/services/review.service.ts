import { reviewRepository } from '../repositories/review.repository';
import { llmClient } from '../llm/client';
import template from '../prompts/summarize_reviews.txt';

export const reviewService = {
   async summarizeReviews(productId: number): Promise<string> {
      const existingSummary =
         await reviewRepository.getReviewSummary(productId);
      if (existingSummary) {
         return existingSummary;
      }

      const reviews = await reviewRepository.getReviews(productId, 10); // get last 10 (arbitrary value) reviews
      const joinedReviews = reviews.map((r) => r.content).join('\n\n');

      const prompt = template.replace('{{reviews}}', joinedReviews);
      const { text: summary } = await llmClient.generateText({
         model: 'gpt-4.1-nano-2025-04-14',
         prompt,
         temperature: 0.2,
         maxTokens: 500,
      });

      await reviewRepository.storeReviewSummary(productId, summary);

      return summary;
   },
};
