'use client';

import { useState, useCallback } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { Button, Card, Input } from '@/design-system/primitives';
import { ProductTable } from './components/product-table';
import { ProductFormModal } from './components/product-form-modal';
import { useProductsQuery } from '@/hooks/use-products';
import { useStoreStore } from '@/store/store-store';
import { useDebounce } from '@/hooks/use-debounce';
import type { Product } from '@/types/product';
import Link from 'next/link';

export function ProductsPageContent() {
  const { currentStore } = useStoreStore();
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useProductsQuery(currentStore?.id ?? '', {
    search: debouncedSearch || undefined,
  });

  const handleEdit = useCallback((p: Product) => {
    setEditProduct(p);
    setModalOpen(true);
  }, []);

  if (!currentStore) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="mb-3 h-8 w-8 text-amber-500" />
        <h3 className="font-semibold text-slate-800">No store selected</h3>
        <p className="mt-1 text-sm text-slate-500">Select a store from the sidebar to manage products.</p>
        <Link href="/stores">
          <Button className="mt-4" variant="outline">Go to Stores</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">{currentStore.name}</p>
        </div>
        <Button onClick={() => { setEditProduct(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card>
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-8"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <ProductTable
          storeId={currentStore.id}
          products={data?.data ?? []}
          isLoading={isLoading}
          onEdit={handleEdit}
        />
      </Card>

      <ProductFormModal
        storeId={currentStore.id}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        editProduct={editProduct}
      />
    </>
  );
}
