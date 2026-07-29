/** Mirrors ProductReviewService.serialize() in
 *  apps/api/src/modules/buyer/product-review.service.ts. */
export interface ProductReview {
  id: string;
  productId: string;
  rating: number;
  comment: string | null;
  images: string[];
  verifiedPurchase: boolean;
  buyer: { id: string; name: string } | null;
  order: { id: string; orderNumber: string } | null;
  createdAt: string;
}

export interface ProductReviewAggregate {
  ratingAvg: number;
  ratingCount: number;
}

export interface ProductReviewsResult {
  reviews: ProductReview[];
  aggregate: ProductReviewAggregate;
  page: number;
  limit: number;
  total: number;
}

export interface CreateProductReviewPayload {
  rating: number;
  comment?: string;
  images?: string[];
  orderId?: string;
}
