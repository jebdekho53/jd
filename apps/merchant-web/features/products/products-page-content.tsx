'use client';

import { useState, useCallback, useMemo } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { Button, Card, Input } from '@/design-system/primitives';
import { BackButton } from '@/components/navigation/back-button';
import { ProductTable } from './components/product-table';
import { ProductFormModal } from './components/product-form-modal';
import { AddProductModeSelector, type AddProductMode } from './components/add-product-mode-selector';
import { ProductCsvImportModal } from './components/product-csv-import-modal';
import { ProductAiModal } from './components/product-ai-modal';
import { ProductAiBillingTab } from './components/product-ai-billing-tab';
import { AiWalletCard } from './components/ai-wallet-card';
import { AiChargeReceiptModal } from './components/ai-charge-receipt-modal';
import { useProductsQuery } from '@/hooks/use-products';
import { useStoreCatalogKind } from '@/hooks/use-store-catalog-kind';
import { useStoreStore } from '@/store/store-store';
import { useDebounce } from '@/hooks/use-debounce';
import type { Product } from '@/types/product';
import type { AiChargeReceipt } from '@/services/products/product-creation-api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import {
  countIncompleteProducts,
  MERCHANT_PRODUCT_REQUIRED_HINT,
  ProductVisibilityNotice,
} from './components/product-visibility-notice';

type ProductsTab = 'catalog' | 'ai-billing';

export function ProductsPageContent() {
  const router = useRouter();
  const { currentStore } = useStoreStore();
  const { isMenuStore, isLoading: catalogLoading } = useStoreCatalogKind(currentStore?.id);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modeSelectorOpen, setModeSelectorOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductsTab>('catalog');
  const [receipt, setReceipt] = useState<AiChargeReceipt | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useProductsQuery(currentStore?.id ?? '', {
    search: debouncedSearch || undefined,
  });

  const products = data?.data ?? [];
  const incompleteCount = useMemo(() => countIncompleteProducts(products), [products]);

  const handleEdit = useCallback((p: Product) => {
    setEditProduct(p);
    setModalOpen(true);
  }, []);

  const handleModeSelect = useCallback((mode: AddProductMode) => {
    if (mode === 'manual') {
      setEditProduct(null);
      setModalOpen(true);
    } else if (mode === 'csv') {
      setCsvModalOpen(true);
    } else {
      setAiModalOpen(true);
    }
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

  if (catalogLoading) {
    return (
      <div className="flex justify-center py-16 text-sm text-slate-500">Loading store type…</div>
    );
  }

  if (isMenuStore) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Restaurant menu, not products</h2>
        <p className="mt-2 text-sm text-slate-500">
          This store uses food menu categories. Add dishes from Menu Management instead of Products.
        </p>
        <Link href={`/stores/${currentStore.id}/menu`} className="mt-4 inline-block">
          <Button>Go to Menu</Button>
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
        <div className="flex items-center gap-2">
          {activeTab === 'ai-billing' && (
            <BackButton fallbackHref="/products" />
          )}
          <Button onClick={() => setModeSelectorOpen(true)}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <AiWalletCard />
      </div>

      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {([
          ['catalog', 'All Products'],
          ['ai-billing', 'AI Usage & Billing'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setActiveTab(id);
              if (id === 'catalog') router.replace('/products', { scroll: false });
            }}
            className={cn(
              'px-4 py-2 text-sm font-medium transition',
              activeTab === id
                ? 'border-b-2 border-indigo-600 text-indigo-700'
                : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'catalog' ? (
        <Card>
          {incompleteCount > 0 && !debouncedSearch && (
            <div className="border-b border-amber-100 px-4 py-3">
              <ProductVisibilityNotice incompleteProductCount={incompleteCount} />
            </div>
          )}
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">{MERCHANT_PRODUCT_REQUIRED_HINT}</p>
              <div className="relative max-w-xs w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-8"
                  placeholder="Search products…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
          <ProductTable
            storeId={currentStore.id}
            products={products}
            isLoading={isLoading}
            onEdit={handleEdit}
          />
        </Card>
      ) : (
        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-600">
              AI product charges (₹1.50 per confirmed product). Manual and CSV uploads are always free.
            </p>
          </div>
          <ProductAiBillingTab storeId={currentStore.id} />
        </Card>
      )}

      <ProductFormModal
        storeId={currentStore.id}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        editProduct={editProduct}
      />

      <AddProductModeSelector
        open={modeSelectorOpen}
        onClose={() => setModeSelectorOpen(false)}
        onSelect={handleModeSelect}
      />
      <ProductCsvImportModal
        storeId={currentStore.id}
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
      />
      <ProductAiModal
        storeId={currentStore.id}
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onReceipt={setReceipt}
      />
      <AiChargeReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </>
  );
}
