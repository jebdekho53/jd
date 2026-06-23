export interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
}

export interface InitiateCheckoutPayload {
  deliveryAddress: DeliveryAddress;
  buyerNote?: string;
}

export interface CheckoutResult {
  id: string;
  status: string;
  expiresAt: string;
  orderId?: string;
  razorpayKeyId?: string;
}

export interface CodCheckoutResult {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
}

export interface RazorpayOrderResult {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  checkoutId: string;
  orderNumber: string;
  buyerName: string;
  buyerPhone: string;
}

export interface VerifyPaymentPayload {
  checkoutId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResult {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
}

export type PaymentMethod = 'COD' | 'RAZORPAY';

export type CheckoutStep = 'address' | 'payment' | 'processing' | 'done';
