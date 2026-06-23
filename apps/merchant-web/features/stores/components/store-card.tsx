'use client';

import Link from 'next/link';
import { Store, ArrowRight, MapPin, Clock } from 'lucide-react';
import { Card, CardBody, Button } from '@/design-system/primitives';
import { StoreStatusBadge } from './store-status-badge';
import type { Store as StoreType } from '@/types/store';

export function StoreCard({ store }: { store: StoreType }) {
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

        {store.status === 'REJECTED' && store.reviewNote && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            <strong>Rejection note:</strong> {store.reviewNote}
          </div>
        )}

        <Link href={`/stores/${store.id}`} className="mt-1">
          <Button variant="outline" size="sm" fullWidth className="gap-1">
            Manage <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardBody>
    </Card>
  );
}
