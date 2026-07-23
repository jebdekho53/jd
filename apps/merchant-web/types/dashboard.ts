export interface SparkPoint {
  date: string;
  value: number;
}

export interface MerchantOverview {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  preparingOrders: number;
  packingOrders: number;
  readyForPickup: number;
  deliveredToday: number;
  cancelledOrders: number;
  avgOrderValue: number;
  customerRating: number;
  ratingCount: number;
  growth: { ordersPct: number; revenuePct: number };
  sparkline: SparkPoint[];
}

export interface MerchantOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  itemsCount: number;
  amount: number;
  createdAt: string;
  status: string;
  orderVertical?: 'GROCERY' | 'FOOD';
  rider: { id: string; name: string; phone: string; status: string } | null;
  deliveryStatus: string | null;
  etaMinutes: number | null;
}

export interface MerchantOrdersDashboard {
  orders: MerchantOrderRow[];
  tabs: Record<string, number>;
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface MerchantInventoryDashboard {
  summary: {
    totalProducts: number;
    activeProducts: number;
    outOfStock: number;
    lowStock: number;
    hiddenProducts: number;
    draftProducts: number;
  };
  lowStockProducts: {
    productId: string;
    productName: string;
    variantId: string;
    quantity: number;
    threshold: number;
  }[];
  topSelling: { productId: string; productName: string; unitsSold: number }[];
}

export interface MerchantRidersDashboard {
  assignedRiders: number;
  onlineRiders: number;
  currentDeliveries: number;
  riders: {
    riderId: string;
    name: string;
    phone: string;
    status: string;
    currentOrder: { id: string; orderNumber: string };
    deliveryStatus: string;
    etaMinutes: number | null;
    lastLocation: { lat: number; lng: number; recordedAt: string } | null;
  }[];
}

export interface MerchantAnalyticsDashboard {
  period: string;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  avgPrepTimeMins: number;
  cancellationRate: number;
  acceptanceRate: number;
  revenueSeries: { date: string; revenue: number; orders: number }[];
  categorySales: { category: string; revenue: number; units: number }[];
  hourlyDemand: { hour: number; orders: number }[];
  bestSellers: { productId: string; productName: string; units: number; revenue: number }[];
  worstSellers: { productId: string; productName: string; units: number; revenue: number }[];
}

export interface MerchantCustomersDashboard {
  totalCustomers: number;
  returningCustomers: number;
  newCustomers: number;
  repeatPurchasePct: number;
  topCustomers: { id: string; name: string; phone: string; orderCount: number }[];
  recentReviews: {
    id: string;
    rating: number;
    comment: string | null;
    customerName: string;
    createdAt: string;
  }[];
  recentComplaints: { id: string; message: string; createdAt: string }[];
}

export interface MerchantComplianceDashboard {
  stores: {
    id: string;
    name: string;
    approvalStatus: string;
    kycStatus: string;
    gstProvided: boolean;
    fssaiProvided: boolean;
    documents: { type: string; uploadedAt: string }[];
    timeline: ({ event: string; at: string; note?: string } | false)[];
  }[];
  categoryRequests: {
    approved: number;
    pending: number;
    rejected: number;
    documentsRequired: number;
  };
  alerts: { storeId: string; storeName: string; status: string; message: string }[];
}

export interface MerchantNotificationsDashboard {
  recentOrders: { id: string; orderNumber: string; status: string; createdAt: string }[];
  newReviews: { id: string; rating: number; createdAt: string }[];
  inventoryAlerts: number;
  complianceAlerts: { storeId: string; storeName: string; status: string; message: string }[];
  categoryRequests: number;
}
