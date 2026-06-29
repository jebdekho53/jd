'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button, Card, CardBody, Spinner } from '@/design-system/primitives';
import { useToast } from '@/design-system/primitives';
import {
  useCategoryCatalogQuery,
  useCategoryRequestsQuery,
  useRequestCategoryMutation,
} from '@/hooks/use-categories-governance';
import { useStoreStore } from '@/store/store-store';
import type { StoreCategoryRequest, StoreCategoryRequestStatus } from '@/types/category-governance';
import { RequestCategoryModal } from './components/request-category-modal';

const TABS: { label: string; value: StoreCategoryRequestStatus }[] = [
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Under review', value: 'UNDER_REVIEW' },
  { label: 'Documents required', value: 'DOCUMENTS_REQUIRED' },
  { label: 'Rejected', value: 'REJECTED' },
];

function RequestCard({ request }: { request: StoreCategoryRequest }) {
  return (
    <Card>
      <CardBody className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-900">
              {request.category.name} → {request.subcategory.name}
            </p>
            {request.store && (
              <p className="text-xs text-slate-500">Store: {request.store.name}</p>
            )}
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{request.status}</span>
        </div>
        {request.reason && <p className="text-sm text-slate-600">{request.reason}</p>}
        {request.adminNote && request.status === 'REJECTED' && (
          <p className="text-sm text-red-700">Rejected: {request.adminNote}</p>
        )}
        {request.adminNote && request.status === 'DOCUMENTS_REQUIRED' && (
          <p className="text-sm text-blue-800">Documents: {request.adminNote}</p>
        )}
        {request.status === 'UNDER_REVIEW' && (
          <p className="text-sm text-amber-700">Under admin review — not rejected.</p>
        )}
      </CardBody>
    </Card>
  );
}

export function CategoriesPageContent() {
  const { toast } = useToast();
  const { currentStore } = useStoreStore();
  const storeId = currentStore?.id;
  const [tab, setTab] = useState<StoreCategoryRequestStatus>('APPROVED');
  const [modalOpen, setModalOpen] = useState(false);
  const { data: requests, isLoading } = useCategoryRequestsQuery(storeId);
  const { data: catalog } = useCategoryCatalogQuery(storeId);
  const requestMutation = useRequestCategoryMutation(storeId);
  const isMenuCatalog = catalog?.[0]?.catalogKind === 'MENU';

  const filtered = (requests ?? []).filter((r) => r.status === tab);

  const handleRequest = async (
    categoryId: string,
    subcategoryId: string,
    reason?: string,
  ) => {
    try {
      await requestMutation.mutateAsync({ categoryId, subcategoryId, reason });
      toast('Category access requested', 'success');
      setModalOpen(false);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  if (!storeId) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        Select a store from the sidebar to manage category access.
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Store Categories</h1>
          <p className="text-sm text-slate-500">
            {isMenuCatalog ? (
              <>
                Request approval for <strong>{currentStore?.name}</strong> to sell in platform menu categories.
                Only approved subcategories can be used when building your restaurant menu.
              </>
            ) : (
              <>
                Request approval for <strong>{currentStore?.name}</strong> to sell in platform categories.
                Only approved subcategories can be used when creating products.
              </>
            )}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> {isMenuCatalog ? 'Request menu category' : 'Request category'}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No categories in this view.{' '}
          <button type="button" className="text-brand-600 underline" onClick={() => setModalOpen(true)}>
            Request a category
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => <RequestCard key={r.id} request={r} />)}
        </div>
      )}

      {tab === 'APPROVED' && (requests ?? []).filter((r) => r.status === 'APPROVED').length === 0 && (
        <p className="mt-4 text-sm text-amber-700">
          You need at least one approved category before creating products.{' '}
          <Link href="/products" className="underline">Go to Products</Link>
        </p>
      )}

      <RequestCategoryModal
        open={modalOpen}
        catalog={catalog ?? []}
        onClose={() => setModalOpen(false)}
        onSubmit={handleRequest}
        loading={requestMutation.isPending}
      />
    </>
  );
}
