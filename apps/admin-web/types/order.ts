export type OrderStatus =
  | 'CREATED'
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
  | 'DELIVERY_FAILED'
  | 'REFUNDED'
  | 'EXPIRED';

export type PaymentMethod = 'COD' | 'RAZORPAY';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
  deliveryStatus?: string | null;
  store: {
    id: string;
    name: string;
    slug?: string;
    merchant: { id: string; businessName: string } | null;
  } | null;
  buyer: { id: string; name: string } | null;
  rider?: { id: string; name: string } | null;
}

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  storeId?: string;
  today?: boolean;
  merchantId?: string;
  riderId?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  statusGroup?: 'pending' | 'preparing' | 'ready_for_pickup' | 'assigned' | 'delivered' | 'cancelled';
}

export interface RiderQueueOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  createdAt: string;
  merchant: { id: string; businessName: string } | null;
  zones: { id: string; name: string }[];
  availableRiderCount: number;
  store: {
    id: string;
    name: string;
    slug: string;
  } | null;
  buyerProfile: { name: string } | null;
  items: { productName: string; quantity: number }[];
}

export interface AvailableRider {
  id: string;
  name: string;
  status: string;
  inZone: boolean;
  activeDeliveries: number;
  distanceKm: number;
  zones: { id: string; name: string }[];
}

export interface AssignRiderResult {
  deliveryId: string;
  riderProfileId: string;
}
