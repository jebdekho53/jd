export interface AdminOverview {
  totalOrders: number;
  ordersToday: number;
  gmvToday: number;
  gmvThisMonth: number;
  totalUsers: number;
  totalBuyers: number;
  totalMerchants: number;
  totalRiders: number;
  totalStores: number;
  activeStores: number;
  approvedStores: number;
  pendingStores: number;
  rejectedStores: number;
  activeRiders: number;
  onlineRiders: number;
  newUsersToday: number;
  cancelledOrdersToday: number;
  failedPayments: number;
  platformRevenue: number;
  storeStatusBreakdown: Record<string, number>;
}

export interface AdminOrdersDashboard {
  orders: {
    id: string;
    orderNumber: string;
    buyer: string;
    store: string;
    storeId: string;
    merchant: string;
    city: string;
    rider: string | null;
    riderId: string | null;
    amount: number;
    status: string;
    createdAt: string;
    deliveryEta: number | null;
  }[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminStoresDashboard {
  summary: Record<string, number>;
  stores: {
    id: string;
    name: string;
    merchant: string;
    gst: string | null;
    kycStatus: string;
    status: string;
    appliedAt: string | null;
    documentCount: number;
    riskScore: number;
  }[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminRidersDashboard {
  online: number;
  offline: number;
  busy: number;
  available: number;
  pendingKyc: number;
  rejectedKyc: number;
  riders: {
    id: string;
    name: string;
    phone: string;
    status: string;
    kycStatus: string;
    currentOrder: string | null;
  }[];
}

export interface AdminUnassignedDashboard {
  count: number;
  availableRiders: number;
  orders: {
    id: string;
    orderNumber: string;
    store: string;
    zone: string;
    amount: number;
    waitingSince: string;
  }[];
}

export interface AdminPaymentsDashboard {
  codOrdersToday: number;
  paidOrdersToday: number;
  failedPayments: number;
  refunds: number;
  revenueTrend: { date: string; revenue: number }[];
}

export interface AdminCustomersDashboard {
  usersToday: number;
  activeUsers: number;
  repeatBuyers: number;
  suspiciousUsers: number;
  refundRequests: number;
}

export interface AdminCategoriesDashboard {
  totalCategories: number;
  categoryRequests: Record<string, number>;
  topCategories: { categoryId: string | null; name: string; productCount: number }[];
  pendingRequests: number;
}

export interface AdminFraudDashboard {
  rejectedMerchants: number;
  blockedUsers: number;
  failedVerifications: number;
  duplicateAccounts: number;
  riskEvents: { id: string; type: string; resource: string; at: string }[];
}

export interface AdminSystemHealthDashboard {
  api: string;
  database: string;
  redis: string;
  queueHealth: string;
  pendingCheckouts: number;
  websocket: string;
  backgroundJobs: string;
  cronStatus: string;
  sms: string;
  pushNotifications: string;
}
