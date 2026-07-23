export type OrderStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'MERCHANT_ACCEPTED'
  | 'PREPARING'
  | 'PACKING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED_BY_BUYER'
  | 'CANCELLED_BY_MERCHANT'
  | 'CANCELLED_BY_ADMIN'
  | 'PAYMENT_FAILED'
  | 'DELIVERY_FAILED'
  | 'REFUNDED'
  | 'EXPIRED';

export type PaymentMethod = 'COD' | 'RAZORPAY';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderVertical?: 'GROCERY' | 'FOOD';
  paymentMethod: PaymentMethod;
  totalAmount: number;
  createdAt: string;
  store: { name: string; slug: string };
  items: { productName: string; quantity: number; imageUrl?: string | null }[];
}

export interface OrderTimelineEntry {
  status: OrderStatus | 'PICKED_UP' | 'ARRIVED_AT_STORE' | 'ARRIVED_AT_CUSTOMER' | 'FAILED';
  note: string | null;
  changedBy: string | null;
  actorType?: string | null;
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
  orderVertical?: 'GROCERY' | 'FOOD';
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
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  store: { id: string; name: string; slug: string; phone: string | null };
  buyerProfile: { id: string; name: string };
  items: OrderDetailItem[];
  statusHistory: OrderTimelineEntry[];
  timeline?: OrderTimelineEntry[];
  delivery?: {
    id: string;
    status: string;
    estimatedMins: number | null;
    estimatedArrivalAt?: string | null;
    etaAvailable?: boolean;
    liveTrackingAvailable?: boolean;
    waitingForPickup?: boolean;
    rider: { id: string; name: string; phone: string | null; vehicleType?: string | null; status: string } | null;
  } | null;
  payment: {
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    status: PaymentStatus;
    method: PaymentMethod;
  } | null;
  canReview?: boolean;
  review?: {
    id: string;
    rating: number;
    storeExperience: number;
    deliveryExperience: number;
    productQuality: number;
    title: string | null;
    review: string | null;
    images: string[];
    verifiedPurchase: boolean;
    merchantReply: string | null;
    merchantRepliedAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface OrderListResponse {
  orders: OrderListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ListOrdersParams {
  status?: OrderStatus;
  statusGroup?: 'active' | 'cancelled' | 'completed';
  page?: number;
  limit?: number;
}
