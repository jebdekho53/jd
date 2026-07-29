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

export interface LegalPendingDocument {
  code: string;
  title: string;
  version: string;
  summary: string;
  isReacceptance: boolean;
}
