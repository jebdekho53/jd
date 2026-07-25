/**
 * Delivery pricing — the single source of truth shared by cart, checkout and
 * order financials so the customer fee, merchant contribution/earning and
 * platform margin never disagree.
 *
 * Model (agreed):
 *  - SELF delivery      → customer pays the merchant's own distance-banded fee
 *                         (selfDeliveryFeeTiers) if configured, else the flat
 *                         platform fee. That fee is credited to the MERCHANT
 *                         (they're doing the delivery work Shadowfax would
 *                         otherwise be paid for), and the platform earns no
 *                         delivery revenue on it.
 *  - PLATFORM, below the merchant's free-delivery threshold → customer pays the
 *                         flat platform fee.
 *  - PLATFORM, at/above the threshold → free to the customer; the MERCHANT
 *                         absorbs the platform fee (deducted from their payout),
 *                         so the platform never subsidises delivery.
 *
 * The flat platform fee is GST-inclusive and set to cover Shadowfax's Zone A
 * (intracity) rate (₹39 + 18% GST ≈ ₹46) with a small buffer — appropriate for
 * a hyperlocal marketplace where virtually all orders are intracity. Zone B/C/D/E
 * tiers can layer on later without changing this contract.
 */

export type DeliveryMode = 'PLATFORM' | 'SELF';

/** One distance band of a merchant's self-delivery fee schedule. */
export interface SelfDeliveryFeeTier {
  /** Inclusive lower bound in km. */
  minKm: number;
  /** Exclusive upper bound in km; null = open-ended (the farthest tier). */
  maxKm: number | null;
  /** Fee in rupees for a delivery whose distance falls in this band. */
  fee: number;
}

/**
 * Fee for a self-delivery order at the given distance: the matching tier if
 * one covers it, else the farthest tier's fee (rather than silently falling
 * back to the flat platform fee, which is likely cheaper than the merchant's
 * real long-distance cost), else the flat fallback when no tiers are set or
 * the distance is unknown.
 */
export function resolveSelfDeliveryFee(
  tiers: SelfDeliveryFeeTier[] | null | undefined,
  distanceKm: number | null | undefined,
  fallbackFee: number,
): number {
  if (!tiers?.length || distanceKm == null) return Math.max(0, fallbackFee);
  const sorted = [...tiers].sort((a, b) => a.minKm - b.minKm);
  const match = sorted.find(
    (t) => distanceKm >= t.minKm && (t.maxKm == null || distanceKm < t.maxKm),
  );
  return Math.max(0, match ? match.fee : sorted[sorted.length - 1].fee);
}

export interface DeliveryPricingInput {
  deliveryMode: DeliveryMode;
  /** Order subtotal (goods value) used to test the free-delivery threshold. */
  subtotal: number;
  /** Merchant's free-delivery threshold; null/undefined = no free-delivery offer. */
  freeDeliveryThreshold?: number | null;
  /** Flat platform delivery fee (GST-inclusive), in rupees. */
  platformFee: number;
  /** Store's own distance-banded self-delivery fee schedule, if configured. */
  selfDeliveryFeeTiers?: SelfDeliveryFeeTier[] | null;
  /** Straight-line/road distance store→delivery address in km, when known. */
  distanceKm?: number | null;
}

export interface DeliveryPricing {
  deliveryMode: DeliveryMode;
  /** What the customer is charged for delivery. */
  customerDeliveryFee: number;
  /** Platform fee the merchant absorbs (deducted from payout); 0 otherwise. */
  merchantDeliveryContribution: number;
  /** Delivery fee credited to the merchant for self-delivery; 0 otherwise. */
  merchantDeliveryEarning: number;
  /** True when delivery is free to the customer (self, or threshold met). */
  freeForCustomer: boolean;
}

export function resolveDeliveryPricing(input: DeliveryPricingInput): DeliveryPricing {
  if (input.deliveryMode === 'SELF') {
    const fee = resolveSelfDeliveryFee(
      input.selfDeliveryFeeTiers,
      input.distanceKm,
      input.platformFee,
    );
    return {
      deliveryMode: 'SELF',
      customerDeliveryFee: fee,
      merchantDeliveryContribution: 0,
      merchantDeliveryEarning: fee,
      freeForCustomer: false,
    };
  }

  const fee = Math.max(0, input.platformFee);
  const threshold = input.freeDeliveryThreshold;
  const meetsThreshold =
    threshold != null && threshold > 0 && input.subtotal >= threshold;

  if (meetsThreshold) {
    // Customer gets free delivery; merchant sponsors the platform fee.
    return {
      deliveryMode: 'PLATFORM',
      customerDeliveryFee: 0,
      merchantDeliveryContribution: fee,
      merchantDeliveryEarning: 0,
      freeForCustomer: true,
    };
  }

  return {
    deliveryMode: 'PLATFORM',
    customerDeliveryFee: fee,
    merchantDeliveryContribution: 0,
    merchantDeliveryEarning: 0,
    freeForCustomer: false,
  };
}
