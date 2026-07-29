export interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  locality?: string;
}

export interface CodCheckoutResult {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
}

export interface CheckoutPayload {
  deliveryAddress: DeliveryAddress;
  buyerNote?: string;
}

export interface PayerContact {
  name: string;
  email: string;
  phone: string;
}

/** Payload for POST /buyer/checkout — initiates online (Razorpay) payment.
 *  Distinct from CheckoutPayload (COD): requires payerContact for Razorpay
 *  prefill/receipts. */
export interface InitiateCheckoutPayload {
  deliveryAddress: DeliveryAddress;
  buyerNote?: string;
  payerContact: PayerContact;
}

export interface InitiateCheckoutResult {
  id: string;
  checkoutId: string;
  orderId: string;
  status: string;
  totalAmount: number;
  expiresAt: string;
}

/** Response from POST /payments/razorpay/create-order — feeds the Razorpay
 *  Standard Checkout options inside the WebView bridge. */
export interface RazorpayOrderResult {
  checkoutId: string;
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  keyId: string;
  amount: number;
  currency: string;
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
  success: boolean;
  orderId: string;
  orderNumber: string;
  message?: string;
}

/** Mirrors LegalSection in apps/api/src/modules/legal/legal-document.types.ts —
 *  `body` paragraphs render as prose, `list` items as bullets. */
export interface LegalSection {
  heading: string;
  body?: string[];
  list?: string[];
}

/** The full document served by GET /legal/documents/:code. */
export interface LegalDocument {
  code: string;
  title: string;
  version: string;
  effectiveDate: string;
  summary: string;
  sections: LegalSection[];
}

export interface LegalPendingDocument {
  code: string;
  title: string;
  version: string;
  summary: string;
  isReacceptance: boolean;
}
