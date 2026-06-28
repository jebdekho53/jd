'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, MessageSquare, Star } from 'lucide-react';
import { Button } from '@/design-system/primitives';
import { buyerKeys, getProductReviews } from '@/services/buyer/buyer-api';
import type { BuyerProductReviewSummary } from '@/types/buyer';
import { ReviewImageUpload } from './review-image-upload';

interface PdpReviewsSectionProps {
  productId: string;
  productName: string;
  reviewSummary?: BuyerProductReviewSummary;
  storeRatingAvg?: number;
  storeRatingCount?: number;
  storeName: string;
}

export function PdpReviewsSection({
  productId,
  productName,
  reviewSummary,
  storeRatingAvg,
  storeRatingCount,
  storeName,
}: PdpReviewsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: buyerKeys.productReviews(productId),
    queryFn: () => getProductReviews(productId),
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/buyer/products/${productId}/reviews`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
          images: reviewImages.length > 0 ? reviewImages : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Could not submit review');
      return json.data;
    },
    onSuccess: () => {
      setShowForm(false);
      setComment('');
      setReviewImages([]);
      queryClient.invalidateQueries({ queryKey: buyerKeys.productReviews(productId) });
      queryClient.invalidateQueries({ queryKey: buyerKeys.product(productId) });
    },
  });

  const aggregate = data?.aggregate ?? reviewSummary;
  const productRating = aggregate?.ratingCount ? aggregate.ratingAvg : undefined;
  const productCount = aggregate?.ratingCount ?? 0;
  const displayRating = productRating ?? storeRatingAvg;
  const displayCount = productCount > 0 ? productCount : storeRatingCount;
  const hasRating = displayRating != null && displayRating > 0;
  const reviews = data?.reviews ?? [];

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5" aria-labelledby="pdp-reviews-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="pdp-reviews-heading" className="text-lg font-semibold text-jd-text-primary">
          Ratings & reviews
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowForm((v) => !v)}
        >
          <MessageSquare className="h-4 w-4" aria-hidden />
          Write a review
        </Button>
      </div>

      {hasRating ? (
        <div className="mb-4 flex flex-wrap items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-jd-text-primary">{displayRating!.toFixed(1)}</p>
            <div className="mt-1 flex justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${s <= Math.round(displayRating!) ? 'fill-amber-400 text-amber-400' : 'text-border'}`}
                  aria-hidden
                />
              ))}
            </div>
            {displayCount != null && displayCount > 0 && (
              <p className="mt-1 text-xs text-jd-text-muted">
                {productCount > 0 ? `${productCount} product reviews` : `${displayCount} store ratings`}
              </p>
            )}
          </div>
          {productCount === 0 && storeRatingAvg != null && (
            <p className="max-w-md text-sm text-jd-text-muted">
              No product reviews yet. Store rating for <strong>{storeName}</strong> is{' '}
              {storeRatingAvg.toFixed(1)}.
            </p>
          )}
        </div>
      ) : (
        <p className="mb-4 text-sm text-jd-text-muted">
          No ratings yet for {productName}. Order and share your experience.
        </p>
      )}

      {showForm && (
        <form
          className="mb-4 space-y-3 rounded-xl border border-border bg-background p-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitReview.mutate();
          }}
        >
          <p className="text-sm font-medium text-jd-text-primary">Rate {productName}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className="p-1"
                aria-label={`${s} stars`}
              >
                <Star
                  className={`h-6 w-6 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-border'}`}
                />
              </button>
            ))}
          </div>
          <textarea
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Share what you liked (verified buyers only)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <ReviewImageUpload images={reviewImages} onChange={setReviewImages} />
          {submitReview.isError && (
            <p className="text-sm text-destructive">{(submitReview.error as Error).message}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={submitReview.isPending}>
              Submit review
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
          <p className="text-xs text-jd-text-muted">
            Only verified buyers who received this product can review.{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      )}

      {isLoading && <p className="text-sm text-jd-text-muted">Loading reviews…</p>}

      {reviews.length > 0 && (
        <ul className="space-y-3 border-t border-border pt-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-background p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-border'}`}
                      aria-hidden
                    />
                  ))}
                </div>
                {r.verifiedPurchase && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                    <BadgeCheck className="h-3 w-3" aria-hidden />
                    Verified purchase
                  </span>
                )}
                <span className="text-xs text-jd-text-muted">{r.buyer?.name ?? 'Buyer'}</span>
              </div>
              {r.comment && <p className="text-sm text-jd-text-secondary">{r.comment}</p>}
              {r.images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.images.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block h-14 w-14 overflow-hidden rounded-lg border border-border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Review photo" className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
