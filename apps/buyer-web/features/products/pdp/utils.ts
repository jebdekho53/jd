import type { BuyerProductWithStore, BuyerVariant } from '@/types/buyer';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export function getDefaultVariant(product: BuyerProductWithStore): BuyerVariant | undefined {
  return product.variants.find((v) => v.isDefault) ?? product.variants[0];
}

export function getVariantLabel(variant: BuyerVariant, unit: string): string {
  if (variant.weightGrams) {
    return variant.weightGrams >= 1000
      ? `${(variant.weightGrams / 1000).toFixed(variant.weightGrams % 1000 === 0 ? 0 : 1)} kg`
      : `${variant.weightGrams} g`;
  }
  return variant.name !== 'Default' ? variant.name : unit;
}

export function getStockStatus(availableQty: number): StockStatus {
  if (availableQty <= 0) return 'out_of_stock';
  if (availableQty <= 10) return 'low_stock';
  return 'in_stock';
}

export function stockLabel(status: StockStatus): string {
  switch (status) {
    case 'out_of_stock':
      return 'Out of stock';
    case 'low_stock':
      return 'Low stock';
    default:
      return 'In stock';
  }
}

export function calcDiscount(price: number, mrp: number | null) {
  const hasDiscount = mrp !== null && mrp > price;
  const savings = hasDiscount ? mrp! - price : 0;
  const discountPct = hasDiscount ? Math.round((savings / mrp!) * 100) : 0;
  return { hasDiscount, savings, discountPct };
}

export function formatEta(mins?: number | null): string | null {
  if (mins == null) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
