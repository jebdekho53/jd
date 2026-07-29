export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  orderVertical: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  store: { id: string; name: string; slug: string } | null;
  storeId: string;
  items: Array<{
    productName: string;
    variantName: string | null;
    quantity: number;
    imageUrl: string | null;
  }>;
}

export interface OrderListResponse {
  orders: OrderListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface OrderStatusHistoryEntry {
  status: string;
  note: string | null;
  changedBy: string | null;
  actorType: string;
  createdAt: string;
}

export interface OrderDetailItem {
  id: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface OrderDelivery {
  status: string | null;
  riderName: string | null;
  riderPhone: string | null;
  estimatedEtaMins: number | null;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  orderVertical: string;
  deliveryMode: 'PLATFORM' | 'SELF';
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  deliveryAddress: Record<string, unknown> | null;
  buyerNote: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  store: { id: string; name: string; slug: string; phone: string | null } | null;
  items: OrderDetailItem[];
  statusHistory: OrderStatusHistoryEntry[];
  delivery: OrderDelivery | null;
  canReview: boolean;
}

export const BUYER_CANCELLABLE = new Set(['PAYMENT_PENDING', 'PAID']);
