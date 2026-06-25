import type { PipelineColumn } from '@/lib/order-pipeline';

export type SlaLevel = 'green' | 'yellow' | 'red';

export interface OrderOperationsMeta {
  pipelineColumn: PipelineColumn;
  orderAgeMins: number;
  sinceAcceptedMins: number | null;
  sincePackingMins?: number | null;
  awaitingRider?: boolean;
  riderWaitMins?: number;
  prepSla: SlaLevel;
  packSla?: SlaLevel;
  riderWaitSla?: SlaLevel;
}

export interface MerchantOrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
  storeId?: string;
  pipelineColumn?: PipelineColumn;
  buyerProfile?: { name: string; phone: string | null } | null;
  rider?: { id: string; name: string; phone: string | null } | null;
  deliveryStatus?: string | null;
  awaitingRider?: boolean;
  riderWaitMins?: number;
  operations?: OrderOperationsMeta;
  items: { productName: string; quantity: number; sku?: string }[];
}

export interface CustomerPanel {
  name: string | null;
  phone: string | null;
  orderCount: number;
  lifetimeSpend: number;
}

export type OrderStatus =
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'MERCHANT_ACCEPTED'
  | 'PREPARING'
  | 'PACKING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'PICKED_UP'
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

export interface OrderListItem extends MerchantOrderListItem {
  store: { id: string; name: string; slug: string } | null;
}

export interface OrderTimelineEntry {
  status: OrderStatus | 'PICKED_UP' | 'ARRIVED_AT_STORE' | 'ARRIVED_AT_CUSTOMER';
  note: string | null;
  changedBy: string | null;
  createdAt: string;
}

export interface OrderDeliveryRider {
  id: string;
  name: string;
  phone: string | null;
  vehicleType?: string | null;
  status: string;
  currentLat: number | null;
  currentLng: number | null;
  lastLocationAt: string | null;
}

export interface OrderDelivery {
  id: string;
  status: string;
  distanceKm: number | null;
  estimatedMins: number | null;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  rider: OrderDeliveryRider | null;
  assignmentTimeline: {
    id: string;
    status: string;
    offeredAt: string;
    respondedAt: string | null;
    expiresAt: string;
    riderName: string | null;
  }[];
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
  buyerProfile: { id: string; name: string; phone?: string | null };
  customer?: CustomerPanel;
  operations?: OrderOperationsMeta;
  items: OrderDetailItem[];
  statusHistory: OrderTimelineEntry[];
  timeline?: OrderTimelineEntry[];
  delivery?: OrderDelivery | null;
}

export interface OrderListResponse {
  orders: MerchantOrderListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ListOrdersParams {
  status?: OrderStatus;
  merchantStatusGroup?:
    | 'new'
    | 'accepted'
    | 'preparing'
    | 'packing'
    | 'ready_for_pickup'
    | 'rider_assigned'
    | 'delivered'
    | 'cancelled';
  pipelineColumn?: PipelineColumn;
  storeId?: string;
  page?: number;
  limit?: number;
  today?: boolean;
  yesterday?: boolean;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: PaymentMethod;
  q?: string;
}
