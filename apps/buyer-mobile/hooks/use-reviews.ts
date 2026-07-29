import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProductReview, getProductReviews } from '@/services/buyer-api';
import type { CreateProductReviewPayload } from '@/types/reviews';

export const reviewKeys = {
  product: (productId: string) => ['reviews', 'product', productId] as const,
};

export function useProductReviewsQuery(productId: string) {
  return useQuery({
    queryKey: reviewKeys.product(productId),
    queryFn: () => getProductReviews(productId),
    enabled: !!productId,
    staleTime: 60_000,
  });
}

export function useCreateProductReviewMutation(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductReviewPayload) => createProductReview(productId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.product(productId) });
      // Prefix match so the product refreshes regardless of which store slug
      // it was opened from (buyerKeys.product keys on [id, storeSlug]).
      qc.invalidateQueries({ queryKey: ['products', 'detail', productId] });
    },
  });
}
