'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Edit2, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { Table, THead, TBody, Tr, Th, Td, Badge, Button, Skeleton } from '@/design-system/primitives';
import { InventoryInlineEditor } from './inventory-inline-editor';
import { useDeleteProductMutation, useToggleProductStatusMutation } from '@/hooks/use-products';
import { useToast } from '@/design-system/primitives';
import type { Product } from '@/types/product';

interface Props {
  storeId: string;
  products: Product[];
  isLoading: boolean;
  onEdit: (p: Product) => void;
}

export function ProductTable({ storeId, products, isLoading, onEdit }: Props) {
  const { toast } = useToast();
  const deleteMutation = useDeleteProductMutation(storeId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync(id);
      toast('Product deleted', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        <p className="text-sm">No products yet. Create your first one.</p>
      </div>
    );
  }

  return (
    <Table>
      <THead>
        <Tr>
          <Th>Product</Th>
          <Th>SKU</Th>
          <Th>Price</Th>
          <Th>Stock</Th>
          <Th>Status</Th>
          <Th />
        </Tr>
      </THead>
      <TBody>
        {products.map((p) => {
          const defaultVariant = p.variants.find((v) => v.isDefault) ?? p.variants[0];
          const stock = defaultVariant?.inventory?.availableQty ?? 0;
          const lowStock = defaultVariant?.inventory?.lowStockThreshold;
          const isLow = lowStock !== null && lowStock !== undefined && stock <= lowStock;

          return (
            <Tr key={p.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {p.imageUrls[0] ? (
                      <Image src={p.imageUrls[0]} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs font-bold text-slate-400">
                        {p.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{p.name}</p>
                    {p.brand && <p className="text-xs text-slate-400">{p.brand}</p>}
                  </div>
                </div>
              </Td>
              <Td>
                <span className="font-mono text-xs text-slate-500">{p.sku ?? '—'}</span>
              </Td>
              <Td>
                <div>
                  <span className="font-semibold">₹{p.basePrice}</span>
                  {p.mrp && p.mrp > p.basePrice && (
                    <span className="ml-1 text-xs text-slate-400 line-through">₹{p.mrp}</span>
                  )}
                </div>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  {defaultVariant && (
                    <InventoryInlineEditor
                      storeId={storeId}
                      productId={p.id}
                      variantId={defaultVariant.id}
                      currentQty={stock}
                    />
                  )}
                  {isLow && <Badge tone="warning">Low</Badge>}
                </div>
              </Td>
              <Td>
                <Badge tone={p.isActive ? 'success' : 'neutral'}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </Td>
              <Td>
                <div className="flex items-center gap-1">
                  <Link href={`/products/${p.id}`}>
                    <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(p)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(p.id, p.name)}
                    loading={deletingId === p.id}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Td>
            </Tr>
          );
        })}
      </TBody>
    </Table>
  );
}
