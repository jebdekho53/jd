'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listReviews, moderateReview } from '@/services/admin-api';
import { Button } from '@/design-system';

const TABS = [
  { label: 'Reported', value: 'REPORTED' },
  { label: 'Visible', value: 'VISIBLE' },
  { label: 'Hidden', value: 'HIDDEN' },
  { label: 'Removed', value: 'REMOVED' },
] as const;

export function ReviewsModerationContent() {
  const [tab, setTab] = useState<(typeof TABS)[number]['value']>('REPORTED');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', tab],
    queryFn: () => listReviews({ status: tab, limit: 50 }),
  });

  const moderate = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'hide' | 'restore' | 'remove' }) =>
      moderateReview(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });

  const reviews = data?.data ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Moderate store reviews across the platform.</p>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.value ? 'bg-admin-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-xl border bg-white p-4">
            <p className="font-medium">{r.store?.name} · {r.rating}★</p>
            <p className="text-sm text-slate-600">{r.review}</p>
            {r.reportReason && <p className="text-xs text-red-600">Report: {r.reportReason}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {tab === 'REPORTED' && (
                <>
                  <Button size="sm" onClick={() => moderate.mutate({ id: r.id, action: 'approve' })}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id: r.id, action: 'hide' })}>Hide</Button>
                  <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id: r.id, action: 'remove' })}>Remove</Button>
                </>
              )}
              {tab === 'HIDDEN' && (
                <Button size="sm" onClick={() => moderate.mutate({ id: r.id, action: 'restore' })}>Restore</Button>
              )}
              {tab === 'REMOVED' && (
                <Button size="sm" onClick={() => moderate.mutate({ id: r.id, action: 'restore' })}>Restore</Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
