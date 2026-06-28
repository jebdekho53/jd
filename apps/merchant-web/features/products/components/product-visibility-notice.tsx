'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/design-system/primitives';
import type { Product } from '@/types/product';
import {
  getProductVisibilityGaps,
  pickStoreFssaiLicense,
  VISIBILITY_GAP_LABELS,
  type ProductVisibilityGap,
} from '../product-visibility.util';

export const MERCHANT_PRODUCT_REQUIRED_HINT =
  'Fields marked * are required for your product to be visible and purchasable on Jebdekho.';

function formatGaps(gaps: ProductVisibilityGap[]): string {
  return gaps.map((g) => VISIBILITY_GAP_LABELS[g]).join(', ');
}

interface ProductVisibilityNoticeProps {
  gaps?: ProductVisibilityGap[];
  incompleteProductCount?: number;
  onEdit?: () => void;
  className?: string;
}

/** Merchant-wide notice — not tied to any single store or product name. */
export function ProductVisibilityNotice({
  gaps,
  incompleteProductCount = 0,
  onEdit,
  className = '',
}: ProductVisibilityNoticeProps) {
  const hasGaps = gaps && gaps.length > 0;
  const hasIncomplete = incompleteProductCount > 0;

  if (!hasGaps && !hasIncomplete) return null;

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-start sm:justify-between ${className}`}
      role="status"
    >
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        <div>
          {hasIncomplete && !hasGaps && (
            <p className="font-medium">
              {incompleteProductCount === 1
                ? '1 product needs updates before buyers can see it on Jebdekho.'
                : `${incompleteProductCount} products need updates before buyers can see them on Jebdekho.`}
            </p>
          )}
          {hasGaps && (
            <p className="font-medium">
              Complete required fields so buyers can see this product on Jebdekho.
            </p>
          )}
          {hasGaps && (
            <p className="mt-1 text-xs text-amber-800">
              Missing: {formatGaps(gaps)}
            </p>
          )}
          <p className="mt-1 text-xs text-amber-800">{MERCHANT_PRODUCT_REQUIRED_HINT}</p>
        </div>
      </div>
      {onEdit && (
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onEdit}>
          Edit product
        </Button>
      )}
    </div>
  );
}

export function countIncompleteProducts(products: Product[]): number {
  const storeFssai = pickStoreFssaiLicense(products);
  return products.filter((p) => getProductVisibilityGaps(p, undefined, storeFssai).length > 0).length;
}
