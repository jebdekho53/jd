export interface CompareStoreOffer {
  storeId: string;
  storeName: string;
  storeSlug: string;
  productId: string;
  variantId: string;
  price: number;
  offerPrice: number;
  mrp: number | null;
  discount: number;
  discountPercent: number;
  deliveryFee: number;
  minimumOrder: number;
  distanceKm: number | null;
  etaMins: number | null;
  rating: number | null;
  stock: number;
  finalPayableAmount: number;
  serviceable: boolean;
  cheapest: boolean;
  deliveryPartner: string;
}

export interface CompareProductResult {
  productId: string;
  name: string;
  unit: string;
  imageUrl: string | null;
  bestPrice: number;
  savings: number;
  savingsPercent: number;
  stores: CompareStoreOffer[];
}

export function buildCompareResult(
  anchor: { id: string; name: string; unit: string; imageUrls: string[] },
  offers: CompareStoreOffer[],
): CompareProductResult | null {
  const unique = offers.filter(
    (o, i, arr) => arr.findIndex((x) => x.storeId === o.storeId) === i,
  );
  if (unique.length < 1) return null;

  const serviceable = unique.filter((o) => o.serviceable && o.stock > 0);
  const pool = serviceable.length > 0 ? serviceable : unique;

  const sorted = [...pool].sort((a, b) => a.finalPayableAmount - b.finalPayableAmount);
  const withFlags = sorted.map((o, i) => ({ ...o, cheapest: i === 0 }));

  const best = withFlags[0]!;
  const highest = withFlags[withFlags.length - 1]!;
  const savings = Math.max(0, highest.finalPayableAmount - best.finalPayableAmount);
  const savingsPercent =
    highest.finalPayableAmount > 0
      ? Math.round((savings / highest.finalPayableAmount) * 100)
      : 0;

  return {
    productId: anchor.id,
    name: anchor.name,
    unit: anchor.unit,
    imageUrl: anchor.imageUrls[0] ?? null,
    bestPrice: best.finalPayableAmount,
    savings,
    savingsPercent,
    stores: withFlags,
  };
}
