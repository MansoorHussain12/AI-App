import type { Review } from '../generated/prisma/client';
import { prisma } from '../prisma/PrismaClient';

export const reviewRepository = {
   getReviews(productId: number): Promise<Review[]> {
      return prisma.review.findMany({
         where: { productId },
         orderBy: { createdAt: 'desc' },
      });
   },
};
