import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import StarRating from './StarRating';
import { Button } from '../ui/button';
import { HiSparkles } from 'react-icons/hi2';
import { useState } from 'react';

type Props = {
   productId: number;
};

type Review = {
   id: number;
   author: string;
   content: string;
   rating: number;
   createdAt: string;
};

type GetReviewsResponse = {
   summary: string | null;
   reviews: Review[];
};

type SummarizeResponse = {
   summary: string;
};

const ReviewList = ({ productId }: Props) => {
   const [summary, setSummary] = useState('');

   const {
      data: reviewData,
      error,
      isLoading,
   } = useQuery<GetReviewsResponse>({
      queryKey: ['reviews', productId],
      queryFn: () => fetchReviews(),
   });

   const handleSummarize = async () => {
      const { data } = await axios.post<SummarizeResponse>(
         `/api/products/${productId}/reviews/summarize`
      );

      setSummary(data.summary);
   };

   const fetchReviews = async () => {
      const { data } = await axios.get<GetReviewsResponse>(
         `/api/products/${productId}/reviews`
      );

      return data;
   };

   if (isLoading) {
      return (
         <div className="flex flex-col gap-5">
            {[1, 2, 3].map((i) => (
               <div key={i}>
                  <Skeleton width={150} />
                  <Skeleton width={100} />
                  <Skeleton count={2} />
               </div>
            ))}
         </div>
      );
   }

   if (error) {
      return <p className="text-red-500">Couldn't fetch reviews. Try again!</p>;
   }

   if (!reviewData?.reviews.length) {
      return null;
   }

   const currentSummary = reviewData.summary || summary;

   return (
      <div>
         <div className="mb-5">
            {currentSummary ? (
               <p>{currentSummary}</p>
            ) : (
               <Button onClick={handleSummarize}>
                  {' '}
                  <HiSparkles /> Summarize
               </Button>
            )}
         </div>
         <div className="flex flex-col gap-5">
            {reviewData?.reviews.map((review) => (
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
