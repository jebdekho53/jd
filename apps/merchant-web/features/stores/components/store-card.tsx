'use client';

import Link from 'next/link';
import { Store, ArrowRight, MapPin, Clock, Send } from 'lucide-react';
import { Card, CardBody, Button } from '@/design-system/primitives';
import { StoreStatusBadge } from './store-status-badge';
import { useSubmitStoreForReviewMutation } from '@/hooks/use-stores';
import { useToast } from '@/design-system/primitives';
import type { Store as StoreType } from '@/types/store';

export function StoreCard({ store }: { store: StoreType }) {
  const { toast } = useToast();
  const submitMutation = useSubmitStoreForReviewMutation(store.id);
  const canSubmit = store.status === 'DRAFT' && !store.merchantProfile?.isBlacklisted;

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync();
      toast('Store submitted for admin review!', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{store.name}</p>
              <p className="text-xs text-slate-400">{store.slug}</p>
            </div>
          </div>
          <StoreStatusBadge status={store.status} />
        </div>

        {store.status === 'DRAFT' && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <strong>Draft:</strong> Submit for review to send this store to the admin queue.
          </div>
        )}

        {store.description && (
          <p className="text-sm text-slate-600 line-clamp-2">{store.description}</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {store.pincode}
          </span>
          {store.avgPrepTimeMins && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> ~{store.avgPrepTimeMins} min prep
            </span>
          )}
        </div>

        {store.status === 'DOCUMENTS_REQUIRED' && store.documentRequestReason && (
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
            <strong>Documents required:</strong> {store.documentRequestReason}
          </div>
        )}

        {store.status === 'REJECTED' && store.rejectionReason && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            <strong>Rejection note:</strong> {store.rejectionReason}
          </div>
        )}

        <div className="mt-1 flex gap-2">
          {canSubmit && (
            <Button
              size="sm"
              className="flex-1 gap-1"
              loading={submitMutation.isPending}
              onClick={handleSubmit}
            >
              <Send className="h-3 w-3" /> Submit for Review
            </Button>
          )}
          <Link href={`/stores/${store.id}`} className={canSubmit ? 'flex-1' : 'w-full'}>
            <Button variant="outline" size="sm" fullWidth className="gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
