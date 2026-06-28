'use client';

import { Scale } from 'lucide-react';
import { Button } from '@/design-system/primitives';
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button';
import { formatCurrency } from '@/lib/utils';
import type { BuyerProductWithStore, BuyerVariant } from '@/types/buyer';
import { calcDiscount } from '../utils';
import { PdpVariantSelector } from './pdp-summary';

interface PdpPurchaseCardProps {
  product: BuyerProductWithStore;
  variant: BuyerVariant;
  variants: BuyerVariant[];
  selectedVariantId: string;
  onVariantSelect: (id: string) => void;
  onCompare?: () => void;
  showCompare?: boolean;
  className?: string;
  sticky?: boolean;
}

export function PdpPurchaseCard({
  product,
  variant,
  variants,
  selectedVariantId,
  onVariantSelect,
  onCompare,
  showCompare,
  className,
  sticky = false,
}: PdpPurchaseCardProps) {
  const price = variant.price;
  const mrp = variant.mrp ?? product.mrp;
  const { hasDiscount } = calcDiscount(price, mrp);

  return (
    <aside
      className={
        sticky
          ? `sticky top-24 space-y-4 rounded-2xl border border-border bg-card p-4 shadow-elevated ${className ?? ''}`
          : className
      }
    >
      <div className="space-y-1">
        <p className="text-2xl font-bold tabular-nums text-jd-text-primary">{formatCurrency(price)}</p>
        {hasDiscount && mrp != null && (
          <p className="text-sm text-jd-text-muted line-through">{formatCurrency(mrp)}</p>
        )}
        <p className="text-xs text-jd-text-muted">{product.unit} · {product.store.name}</p>
      </div>

      <PdpVariantSelector
        variants={variants}
        selectedId={selectedVariantId}
        unit={product.unit}
        onSelect={onVariantSelect}
      />

      <AddToCartButton
        productId={product.id}
        variantId={variant.id}
        storeId={product.store.id}
        storeName={product.store.name}
        availableQty={variant.availableQty}
        productName={product.name}
        unitPrice={price}
        imageUrl={product.imageUrls[0]}
        className="w-full justify-center"
      />

      {showCompare && onCompare && (
        <Button variant="outline" className="w-full gap-2" onClick={onCompare}>
          <Scale className="h-4 w-4" aria-hidden />
          Compare prices near you
        </Button>
      )}
    </aside>
  );
}
