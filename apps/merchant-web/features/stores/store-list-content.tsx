'use client';

import { useState } from 'react';
import { Plus, Store } from 'lucide-react';
import { Button, Card, CardBody, Skeleton } from '@/design-system/primitives';
import { StoreCard } from './components/store-card';
import { CreateStoreModal } from './components/create-store-modal';
import { useStoresQuery } from '@/hooks/use-stores';

export function StoreListContent() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useStoresQuery();
  const stores = data?.data ?? [];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Stores</h1>
          <p className="text-sm text-slate-500">Manage your store listings</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Store
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardBody><Skeleton className="h-40" /></CardBody></Card>
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
            <Store className="h-7 w-7 text-brand-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No stores yet</h3>
          <p className="mt-1 text-sm text-slate-500">Create your first store to get started</p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create Store
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((s) => <StoreCard key={s.id} store={s} />)}
        </div>
      )}

      <CreateStoreModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
