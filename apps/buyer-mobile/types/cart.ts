import type { BuyerVariant } from './buyer';

export interface CartItemProduct {
  name: string;
  slug: string;
  imageUrls: string[];
  isVeg: boolean | null;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  mrp: number | null;
  lineTotal: number;
  savings: number;
  product: CartItemProduct;
  variant: Pick<BuyerVariant, 'name' | 'sku' | 'weightGrams'>;
  availableQty: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  catalogSavings: number;
  offerDiscount: number;
  couponDiscount: number;
  deliveryDiscount: number;
  totalSavings: number;
  tax: number;
  deliveryFee: number;
  grandTotal: number;
}

export interface CartDelivery {
  mode: 'PLATFORM' | 'SELF';
  isFree: boolean;
  freeDeliveryThreshold: number | null;
  amountToFreeDelivery: number | null;
}

export interface Cart {
  id: string;
  storeId: string;
  store: { id: string; name: string; slug: string; minOrderAmount: number };
  items: CartItem[];
  totals: CartTotals;
  delivery?: CartDelivery;
  itemCount: number;
}
