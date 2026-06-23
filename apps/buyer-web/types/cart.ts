export interface CartItemProduct {
  name: string;
  slug: string;
  imageUrls: string[];
  isVeg: boolean | null;
}

export interface CartItemVariant {
  name: string;
  sku: string;
  weightGrams: number | null;
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
  variant: CartItemVariant;
  availableQty: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  grandTotal: number;
}

export interface CartStore {
  id: string;
  name: string;
  slug: string;
  minOrderAmount: number;
}

export interface Cart {
  id: string;
  storeId: string;
  store: CartStore;
  items: CartItem[];
  totals: CartTotals;
  itemCount: number;
}

export interface AddCartItemPayload {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}
