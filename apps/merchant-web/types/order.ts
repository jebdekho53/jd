export type OrderStatus =
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'MERCHANT_ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED_BY_BUYER'
  | 'CANCELLED_BY_MERCHANT'
  | 'CANCELLED_BY_ADMIN'
  | 'PAYMENT_FAILED'
  | 'REFUNDED';

export type PaymentMethod = 'COD' | 'RAZORPAY';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  createdAt: string;
  store: { id: string; name: string; slug: string } | null;
  items: { productName: string; quantity: number }[];
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  note: string | null;
  changedBy: string | null;
  createdAt: string;
}

export interface OrderDetailItem {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  deliveryAddress: Record<string, unknown>;
  buyerNote: string | null;
  cancelReason: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  store: { id: string; name: string; slug: string; phone: string | null };
  buyerProfile: { id: string; name: string };
  items: OrderDetailItem[];
  statusHistory: OrderTimelineEntry[];
}

export interface OrderListResponse {
  orders: OrderListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ListOrdersParams {
  status?: OrderStatus;
  storeId?: string;
  page?: number;
  limit?: number;
}
