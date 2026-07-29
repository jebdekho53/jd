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

export interface OrderDeliveryRider {
  id: string;
  name: string;
  phone: string | null;
  vehicleType: string | null;
  currentLat: number | null;
  currentLng: number | null;
}

export interface OrderDelivery {
  status: string | null;
  distanceKm: number | null;
  estimatedMins: number | null;
  etaAvailable: boolean;
  liveTrackingAvailable: boolean;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  rider: OrderDeliveryRider | null;
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
  deliveryLat: number | null;
  deliveryLng: number | null;
  buyerNote: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  store: {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  items: OrderDetailItem[];
  statusHistory: OrderStatusHistoryEntry[];
  delivery: OrderDelivery | null;
  canReview: boolean;
}

export const BUYER_CANCELLABLE = new Set(['PAYMENT_PENDING', 'PAID']);
