export interface ProcurementRecommendation {
  id: string;
  productName: string;
  currentStock: number;
  avgDailySales: number;
  predictedOosDays: number;
  recommendedQty: number;
  expectedRevenueImpact: number;
  alertType: string;
}

export interface VendorSummary {
  id: string;
  businessName: string;
  vendorType: string;
  ratingAvg: number;
  ratingCount?: number;
  gstNumber?: string | null;
  city?: { name: string } | null;
  _count?: { products: number };
}

export interface VendorPriceTier {
  id: string;
  minQty: number;
  maxQty?: number | null;
  unitPrice: number;
}

export interface VendorProduct {
  id: string;
  name: string;
  sku: string;
  category?: string | null;
  moq: number;
  gstRate: number;
  basePrice: number;
  unit?: string;
  vendor: { id: string; businessName: string; vendorType: string; ratingAvg: number };
  inventory?: { availableQty: number } | null;
  priceTiers?: VendorPriceTier[];
}

export interface CreditLine {
  id: string;
  vendorId: string;
  creditLimit: number;
  usedLimit: number;
  availableLimit: number;
  overdueAmount: number;
  vendor?: { businessName: string; vendorType: string };
}

export interface ProcurementAnalytics {
  totalSpend?: number;
  procurementSavings?: number;
  fulfillmentRate?: number;
}

export interface CartItem {
  id: string;
  vendorProductId: string;
  quantity: number;
  unitPrice: number;
  vendorProduct: VendorProduct;
}

export interface ProcurementCart {
  id: string;
  storeId?: string | null;
  vendorId?: string | null;
  items: CartItem[];
}

export type VendorOrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type VendorShipmentStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
export type VendorInvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface VendorOrderItem {
  id: string;
  vendorProductId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface VendorOrder {
  id: string;
  orderNumber: string;
  status: VendorOrderStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  creditUsed: number;
  notes?: string | null;
  createdAt: string;
  vendor?: { businessName: string; vendorType: string };
  items: VendorOrderItem[];
  shipment?: { status: VendorShipmentStatus; carrier?: string | null; trackingNumber?: string | null } | null;
  invoice?: { status: VendorInvoiceStatus; totalAmount: number; dueDate?: string | null } | null;
}
