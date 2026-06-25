'use client';

import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import Image from 'next/image';
import { getStoreReputation, getStoreReviews } from '@/services/reviews/reviews-api';

export function StoreReviewsSection({ storeSlug }: { storeSlug: string }) {
  const reputation = useQuery({
    queryKey: ['store-reputation', storeSlug],
    queryFn: () => getStoreReputation(storeSlug),
  });
  const reviews = useQuery({
    queryKey: ['store-reviews', storeSlug],
    queryFn: () => getStoreReviews(storeSlug),
  });

  const rep = reputation.data;
  const list = reviews.data?.reviews ?? [];

  if (!rep && reviews.isLoading) return null;
  if (rep && rep.totalReviews === 0 && !reviews.isLoading) {
    return (
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Customer reviews</h2>
        <p className="mt-2 text-sm text-muted-foreground">No reviews yet — be the first after ordering!</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <h2 className="text-sm font-semibold">Customer reviews</h2>
      {rep && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-3xl font-bold">{rep.averageRating.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">{rep.totalReviews} verified reviews</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {rep.responseRate}% response rate · {rep.repeatCustomers} repeat customers
            </p>
          </div>
          <div className="space-y-1">
            {(['5', '4', '3', '2', '1'] as const).map((star) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-6">{star}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${rep.distributionPct[star]}%` }}
                  />
                </div>
                <span className="w-10 text-right text-muted-foreground">{rep.distributionPct[star]}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ul className="divide-y">
        {list.map((r) => (
          <li key={r.id} className="py-4">
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm font-medium">{r.buyer?.name ?? 'Customer'}</span>
              {r.verifiedPurchase && (
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                  Verified purchase
                </span>
              )}
            </div>
            {r.title && <p className="mt-1 text-sm font-medium">{r.title}</p>}
            {r.review && <p className="mt-1 text-sm text-muted-foreground">{r.review}</p>}
            {r.images.length > 0 && (
              <div className="mt-2 flex gap-2">
                {r.images.map((url) => (
                  <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg">
                    <Image src={url} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
            {r.merchantReply && (
              <div className="mt-2 rounded-lg bg-muted/40 p-3 text-sm">
                <p className="font-medium">Store reply</p>
                <p className="text-muted-foreground">{r.merchantReply}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
