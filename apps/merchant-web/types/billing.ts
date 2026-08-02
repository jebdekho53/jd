export interface OfflineBillItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  shortfall: number;
}

export interface OfflineBill {
  id: string;
  storeId: string;
  customerPhone: string;
  customerName: string | null;
  totalAmount: number;
  note: string | null;
  createdById: string;
  createdAt: string;
  items: OfflineBillItem[];
  shortfallTotal?: number;
}

export interface OfflineBillCustomer {
  customerPhone: string;
  customerName: string | null;
  billCount: number;
  totalSpent: number;
  lastBillAt: string;
}

export interface CreateOfflineBillPayload {
  customerPhone: string;
  customerName?: string;
  note?: string;
  items: Array<{ variantId: string; quantity: number }>;
}

export interface ListOfflineBillsResponse {
  items: OfflineBill[];
  total: number;
  page: number;
  limit: number;
}
