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
