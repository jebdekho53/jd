import type { BuyerProductWithStore } from '@/types/buyer';
import { formatCurrency } from '@/lib/utils';

export interface CompareOffer {
  storeId: string;
  storeName: string;
  storeSlug: string;
  price: number;
  mrp: number | null;
  variantId: string;
  productId: string;
}

export interface CompareGroup {
  key: string;
  name: string;
  unit: string;
  imageUrl: string | null;
  offers: CompareOffer[];
  bestIndex: number;
  savingsPercent: number;
  savingsAmount: number;
}

function getPrice(product: BuyerProductWithStore): { price: number; mrp: number | null; variantId: string } {
  const v = product.variants.find((x) => x.isDefault) ?? product.variants[0];
  return {
    price: v?.price ?? product.basePrice,
    mrp: v?.mrp ?? product.mrp,
    variantId: v?.id ?? '',
  };
}

function normalizeKey(name: string, unit: string): string {
  return `${name.toLowerCase().trim()}|${unit.toLowerCase().trim()}`;
}

/** Group cross-store search results into price-comparison clusters */
export function buildCompareGroups(products: BuyerProductWithStore[], limit = 5): CompareGroup[] {
  const map = new Map<string, CompareGroup>();

  for (const product of products) {
    const { price, mrp, variantId } = getPrice(product);
    if (!variantId) continue;
    const key = normalizeKey(product.name, product.unit);
    const existing = map.get(key);

    const offer: CompareOffer = {
      storeId: product.store.id,
      storeName: product.store.name,
      storeSlug: product.store.slug,
      price,
      mrp,
      variantId,
      productId: product.id,
    };

    if (existing) {
      if (!existing.offers.some((o) => o.storeId === offer.storeId)) {
        existing.offers.push(offer);
      }
    } else {
      map.set(key, {
        key,
        name: product.name,
        unit: product.unit,
        imageUrl: product.imageUrls[0] ?? null,
        offers: [offer],
        bestIndex: 0,
        savingsPercent: 0,
        savingsAmount: 0,
      });
    }
  }

  const groups = Array.from(map.values())
    .filter((g) => g.offers.length >= 2)
    .map((g) => {
      const sorted = [...g.offers].sort((a, b) => a.price - b.price);
      const best = sorted[0]!;
      const highest = sorted[sorted.length - 1]!;
      const savingsAmount = highest.price - best.price;
      const savingsPercent =
        highest.price > 0 ? Math.round((savingsAmount / highest.price) * 100) : 0;
      const bestIndex = g.offers.findIndex((o) => o.storeId === best.storeId);
      return {
        ...g,
        offers: g.offers,
        bestIndex: bestIndex >= 0 ? bestIndex : 0,
        savingsPercent,
        savingsAmount,
      };
    })
    .sort((a, b) => b.savingsPercent - a.savingsPercent)
    .slice(0, limit);

  return groups;
}

export function formatCompareSavings(amount: number): string {
  return formatCurrency(amount);
}
