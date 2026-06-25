'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { merchantFetch } from '@/services/api/merchant-client';
import { useStoreStore } from '@/store/store-store';
import { Button, Card, CardBody, Spinner } from '@/design-system/primitives';

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  review: string | null;
  buyer: { name: string } | null;
  merchantReply: string | null;
  createdAt: string;
}

interface Overview {
  averageRating: number;
  totalReviews: number;
  lowRatingAlerts: number;
  recentReviews: number;
  responseRate: number;
}

export function ReviewsPageContent() {
  const { currentStore } = useStoreStore();
  const storeId = currentStore?.id;
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const qc = useQueryClient();

  const overview = useQuery({
    queryKey: ['merchant', 'reviews', 'overview', storeId],
    queryFn: async () => {
      const res = await merchantFetch<{ success: boolean; data: Overview }>(
        `/api/merchant/stores/${storeId}/reviews/overview`,
      );
      return res.data;
    },
    enabled: Boolean(storeId),
  });

  const reviews = useQuery({
    queryKey: ['merchant', 'reviews', storeId],
    queryFn: async () => {
      const res = await merchantFetch<{ success: boolean; data: ReviewRow[] }>(
        `/api/merchant/stores/${storeId}/reviews?limit=50`,
      );
      return res.data;
    },
    enabled: Boolean(storeId),
  });

  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, reply }: { reviewId: string; reply: string }) => {
      await merchantFetch(`/api/merchant/stores/${storeId}/reviews/${reviewId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply }),
      });
    },
    onSuccess: () => {
      setReplyId(null);
      setReplyText('');
      qc.invalidateQueries({ queryKey: ['merchant', 'reviews'] });
    },
  });

  if (!storeId) {
    return <p className="text-sm text-slate-500">Select a store to view reviews.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Reviews</h1>
        <p className="text-sm text-slate-500">Reputation for {currentStore?.name}</p>
      </div>

      {overview.data && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card><CardBody><p className="text-xs text-slate-500">Average rating</p><p className="text-2xl font-bold">{overview.data.averageRating.toFixed(1)}</p></CardBody></Card>
          <Card><CardBody><p className="text-xs text-slate-500">Total reviews</p><p className="text-2xl font-bold">{overview.data.totalReviews}</p></CardBody></Card>
          <Card><CardBody><p className="text-xs text-slate-500">Low rating alerts</p><p className="text-2xl font-bold text-amber-600">{overview.data.lowRatingAlerts}</p></CardBody></Card>
          <Card><CardBody><p className="text-xs text-slate-500">Response rate</p><p className="text-2xl font-bold">{overview.data.responseRate}%</p></CardBody></Card>
        </div>
      )}

      {reviews.isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <ul className="space-y-3">
          {(reviews.data ?? []).map((r) => (
            <li key={r.id} className="rounded-xl border bg-white p-4">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-medium">{r.buyer?.name ?? 'Customer'} · {r.rating}★</p>
                  {r.title && <p className="text-sm">{r.title}</p>}
                  {r.review && <p className="text-sm text-slate-600">{r.review}</p>}
                  {r.merchantReply && (
                    <p className="mt-2 rounded bg-slate-50 p-2 text-sm text-slate-700">Reply: {r.merchantReply}</p>
                  )}
                </div>
                {!r.merchantReply && (
                  <Button size="sm" variant="outline" onClick={() => setReplyId(r.id)}>Reply</Button>
                )}
              </div>
              {replyId === r.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a public reply…"
                  />
                  <Button
                    size="sm"
                    loading={replyMutation.isPending}
                    onClick={() => replyMutation.mutate({ reviewId: r.id, reply: replyText })}
                  >
                    Send reply
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
