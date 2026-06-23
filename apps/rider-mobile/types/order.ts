export type DeliveryStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'ARRIVED_AT_STORE'
  | 'PICKED_UP'
  | 'ARRIVED_AT_CUSTOMER'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REJECTED';

export interface RiderOrderListItem {
  deliveryId: string;
  orderId: string;
  orderNumber: string;
  deliveryStatus: DeliveryStatus;
  storeName: string;
  storeLat: number;
  storeLng: number;
  customerLat: number;
  customerLng: number;
  customerArea: string;
  totalAmount: number;
  paymentMethod: 'COD' | 'RAZORPAY';
  assignedAt: string;
  riderEarning: number | null;
}

export interface RiderOrderDetail extends RiderOrderListItem {
  storePhone: string | null;
  storeAddress: string;
  deliveryAddress: Record<string, string>;
  buyerNote: string | null;
  distanceKm: number | null;
  estimatedMins: number | null;
  items: { name: string; variant: string; quantity: number }[];
  timeline: { status: DeliveryStatus; at: string }[];
}

export type DeliveryAction =
  | 'accept'
  | 'reject'
  | 'arrived-store'
  | 'picked-up'
  | 'arrived-customer'
  | 'delivered'
  | 'failed';
