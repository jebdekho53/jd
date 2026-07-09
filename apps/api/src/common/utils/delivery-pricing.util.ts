/**
 * Delivery pricing — the single source of truth shared by cart, checkout and
 * order financials so the customer fee, merchant contribution and platform
 * margin never disagree.
 *
 * Model (agreed):
 *  - SELF delivery      → free to the customer; merchant delivers with their own
 *                         rider; platform arranges nothing.
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

export interface DeliveryPricingInput {
  deliveryMode: DeliveryMode;
  /** Order subtotal (goods value) used to test the free-delivery threshold. */
  subtotal: number;
  /** Merchant's free-delivery threshold; null/undefined = no free-delivery offer. */
  freeDeliveryThreshold?: number | null;
  /** Flat platform delivery fee (GST-inclusive), in rupees. */
  platformFee: number;
}

export interface DeliveryPricing {
  deliveryMode: DeliveryMode;
  /** What the customer is charged for delivery. */
  customerDeliveryFee: number;
  /** Platform fee the merchant absorbs (deducted from payout); 0 otherwise. */
  merchantDeliveryContribution: number;
  /** True when delivery is free to the customer (self, or threshold met). */
  freeForCustomer: boolean;
}

export function resolveDeliveryPricing(input: DeliveryPricingInput): DeliveryPricing {
  if (input.deliveryMode === 'SELF') {
    return {
      deliveryMode: 'SELF',
      customerDeliveryFee: 0,
      merchantDeliveryContribution: 0,
      freeForCustomer: true,
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
      freeForCustomer: true,
    };
  }

  return {
    deliveryMode: 'PLATFORM',
    customerDeliveryFee: fee,
    merchantDeliveryContribution: 0,
    freeForCustomer: false,
  };
}
