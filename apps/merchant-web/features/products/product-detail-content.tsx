'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';
import { Button, Card, CardHeader, CardBody, Badge, Spinner, Table, THead, TBody, Tr, Th, Td } from '@/design-system/primitives';
import { InventoryInlineEditor } from './components/inventory-inline-editor';
import { ProductFormModal } from './components/product-form-modal';
import { useProductQuery, useToggleProductStatusMutation } from '@/hooks/use-products';
import { useStoreStore } from '@/store/store-store';
import { useToast } from '@/design-system/primitives';

export function ProductDetailContent({ productId }: { productId: string }) {
  const { currentStore } = useStoreStore();
  const { toast } = useToast();
  const storeId = currentStore?.id ?? '';
  const { data: product, isLoading } = useProductQuery(storeId, productId);
  const toggleMutation = useToggleProductStatusMutation(storeId, productId);
  const [editOpen, setEditOpen] = useState(false);

  const handleToggle = async () => {
    if (!product) return;
    try {
      await toggleMutation.mutateAsync(!product.isActive);
      toast(`Product ${!product.isActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!product) return <p className="text-red-600">Product not found.</p>;

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Products</Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
            <Badge tone={product.isActive ? 'success' : 'neutral'}>
              {product.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {product.brand && <p className="text-sm text-slate-500">{product.brand}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={handleToggle} loading={toggleMutation.isPending}>
          {product.isActive ? <><ToggleRight className="h-4 w-4" /> Deactivate</> : <><ToggleLeft className="h-4 w-4" /> Activate</>}
        </Button>
        <Button size="sm" onClick={() => setEditOpen(true)}>
          <Edit2 className="h-4 w-4" /> Edit
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><h2 className="font-semibold">Product image</h2></CardHeader>
          <CardBody>
            <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-xl bg-slate-100">
              {product.imageUrls[0] ? (
                <Image src={product.imageUrls[0]} alt={product.name} fill className="object-cover" unoptimized />
              ) : (
                <span className="flex h-full items-center justify-center text-4xl font-bold text-slate-300">
                  {product.name.charAt(0)}
                </span>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold">Details</h2></CardHeader>
          <CardBody className="space-y-3 text-sm">
            {product.description && <p className="text-slate-600">{product.description}</p>}
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-slate-400">SKU:</span> <span className="font-mono">{product.sku ?? '—'}</span></div>
              <div><span className="text-slate-400">Unit:</span> {product.unit ?? '—'}</div>
              <div><span className="text-slate-400">Category:</span> {product.category?.name ?? 'Uncategorized'}</div>
              <div><span className="text-slate-400">Tags:</span> {product.tags.join(', ') || '—'}</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold">Variants &amp; Inventory</h2></CardHeader>
          <CardBody className="p-0">
            <Table>
              <THead>
                <Tr>
                  <Th>Variant</Th>
                  <Th>Price</Th>
                  <Th>Stock</Th>
                  <Th>Reserved</Th>
                </Tr>
              </THead>
              <TBody>
                {product.variants.map((v) => (
                  <Tr key={v.id}>
                    <Td>
                      <div>
                        <p className="font-medium">{v.name}</p>
                        <p className="text-xs font-mono text-slate-400">{v.sku}</p>
                      </div>
                    </Td>
                    <Td>₹{v.price}</Td>
                    <Td>
                      <InventoryInlineEditor
                        storeId={storeId}
                        productId={product.id}
                        variantId={v.id}
                        currentQty={v.inventory?.availableQty ?? 0}
                      />
                    </Td>
                    <Td className="text-slate-500">{v.inventory?.reservedQty ?? 0}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      <ProductFormModal
        storeId={storeId}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editProduct={product}
      />
    </>
  );
}
