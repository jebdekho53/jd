import type { OrderTimelineEntry } from '@jebdekho/order-timeline';

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
  | 'REFUNDED';

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  store: {
    id: string;
    name: string;
    slug: string;
    phone?: string | null;
    merchant?: { id: string; businessName: string } | null;
  } | null;
  buyerProfile: { id: string; name: string } | null;
  items: Array<{ productName: string; quantity: number; totalPrice: number }>;
  statusHistory: OrderTimelineEntry[];
  timeline?: OrderTimelineEntry[];
  delivery?: {
    status: string;
    rider?: { id: string; name: string; phone?: string | null } | null;
  } | null;
}
