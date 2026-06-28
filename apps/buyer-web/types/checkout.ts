export interface DeliveryAddress {
  line1: string;
  line2?: string;
  locality?: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  locationPincodeId?: string;
  locationAreaId?: string;
  locationCityId?: string;
}

export interface PayerContact {
  name: string;
  email: string;
  phone: string;
}

export interface InitiateCheckoutPayload {
  deliveryAddress: DeliveryAddress;
  buyerNote?: string;
  walletAmountToUse?: number;
  rewardPointsToRedeem?: number;
  payerContact?: PayerContact;
}

export interface CheckoutResult {
  id: string;
  /** Alias returned by initiate checkout API */
  checkoutId?: string;
  status: string;
  expiresAt: string;
  orderId?: string;
  totalAmount?: number;
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
  buyerEmail: string;
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
  totalAmount?: number;
}

export interface SyncPaymentResult {
  orderId: string;
  orderNumber: string;
  message?: string;
}

export type PaymentMethod = 'COD' | 'RAZORPAY';

export type CheckoutStep = 'address' | 'payment' | 'processing' | 'done';
