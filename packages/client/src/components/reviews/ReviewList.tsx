import { useMutation, useQuery } from '@tanstack/react-query';
import { HiSparkles } from 'react-icons/hi2';
import { Button } from '../ui/button';
import ReviewSkeleton from './ReviewSkeleton';
import StarRating from './StarRating';
import {
   reviewsApi,
   type GetReviewsResponse,
   type SummarizeResponse,
} from './reviewsApi';

type Props = {
   productId: number;
};

const ReviewList = ({ productId }: Props) => {
   const reviewQuery = useQuery<GetReviewsResponse>({
      queryKey: ['reviews', productId],
      queryFn: () => reviewsApi.fetchReviews(productId),
   });

   const summaryMutation = useMutation<SummarizeResponse>({
      mutationFn: () => reviewsApi.summarizeReviews(productId),
   });

   if (reviewQuery.isLoading) {
      return (
         <div className="flex flex-col gap-5">
            {[1, 2, 3].map((i) => (
               <ReviewSkeleton key={i} />
            ))}
         </div>
      );
   }

   if (reviewQuery.isError) {
      return <p className="text-red-500">Couldn't fetch reviews. Try again!</p>;
   }

   if (!reviewQuery.data?.reviews.length) {
      return null;
   }

   const currentSummary =
      reviewQuery.data.summary || summaryMutation.data?.summary;

   return (
      <div>
         <div className="mb-5">
            {currentSummary ? (
               <p>{currentSummary}</p>
            ) : (
               <div>
                  <Button
                     onClick={() => summaryMutation.mutate()}
                     className="cursor-pointer"
                     disabled={summaryMutation.isPending}
                  >
                     {' '}
                     <HiSparkles /> Summarize
                  </Button>
                  {summaryMutation.isPending && (
                     <div className="py-3">
                        <ReviewSkeleton />
                     </div>
                  )}
                  {summaryMutation.isError && (
                     <p className="text-red-500">
                        Couldn't summarize reviews. Try again!
                     </p>
                  )}
               </div>
            )}
         </div>
         <div className="flex flex-col gap-5">
            {reviewQuery.data?.reviews.map((review) => (
               <div key={review.id}>
                  <div className="font-semibold">{review.author}</div>
                  <div>
                     <StarRating value={review.rating} />
                  </div>
                  <p className="py-2">{review.content}</p>
               </div>
            ))}
         </div>
      </div>
   );
};

export default ReviewList;
