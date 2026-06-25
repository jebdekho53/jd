export interface ExecutiveMetrics {
  gmv: number;
  orders: number;
  revenue: number;
  activeBuyers: number;
  activeMerchants: number;
  activeRiders: number;
  conversionRate: number;
  aov: number;
  refundRate: number;
  walletLiability: number;
  rewardLiability: number;
  growthPct: { gmv: number; orders: number; revenue: number };
}

export interface SalesPoint {
  label: string;
  orders: number;
  gmv: number;
  revenue: number;
}

export interface OrderAnalyticsMetrics {
  created: number;
  completed: number;
  cancelled: number;
  returned: number;
  codPct: number;
  walletPct: number;
  razorpayPct: number;
  avgDeliveryMins: number;
  avgPrepMins: number;
}

export interface CustomerAnalyticsMetrics {
  newCustomers: number;
  returningCustomers: number;
  retentionPct: number;
  repeatPurchasePct: number;
  topCustomers: { name: string; orders: number; spend: number }[];
  walletUsers: number;
  tierDistribution: { tier: string; count: number }[];
  referralPerformance: { completed: number; pending: number };
}

export interface MerchantRollupMetrics {
  revenue: number;
  orders: number;
  productsSold: number;
  topCategories: { category: string; revenue: number; units: number }[];
  topProducts: { productId: string; name: string; units: number; revenue: number }[];
  repeatCustomers: number;
  customerLtv: number;
  walletUsage: number;
  rewardRedemption: number;
  storeRatingTrend: { date: string; rating: number; count: number }[];
}

export interface RiderAnalyticsMetrics {
  deliveriesCompleted: number;
  avgDeliveryMins: number;
  acceptanceRate: number;
  rejectionRate: number;
  activeHours: number;
  distanceCoveredKm: number;
  revenueGenerated: number;
  topRiders: { riderId: string; name: string; deliveries: number }[];
  lowPerformingRiders: { riderId: string; name: string; deliveries: number; lateRate: number }[];
}

export interface GeoAnalyticsMetrics {
  topCities: { name: string; count: number; revenue: number }[];
  topAreas: { name: string; count: number; revenue: number }[];
  topLocalities: { name: string; count: number; revenue: number }[];
  highDemandZones: { key: string; count: number }[];
  lowCoverageZones: { key: string; storeCount: number; orderCount: number }[];
  deliveryHeatmap: { lat: number; lng: number; weight: number }[];
  storeDensity: number;
  riderDensity: number;
}

export interface InventoryAnalyticsMetrics {
  fastMoving: { name: string; soldQty: number }[];
  slowMoving: { name: string; availableQty: number }[];
  lowStockRisk: number;
  deadInventory: number;
  inventoryTurnover: number;
  lostSalesOos: number;
}

export interface WalletRewardsMetrics {
  walletCredits: number;
  walletDebits: number;
  outstandingLiability: number;
  rewardIssued: number;
  rewardRedeemed: number;
  rewardExpired: number;
  referralPerformance: { completed: number; pending: number };
  tierUpgrades: number;
}

export interface FunnelMetrics {
  visitors: number;
  searches: number;
  storeViews: number;
  productViews: number;
  addToCart: number;
  checkoutStarted: number;
  orderCreated: number;
  orderCompleted: number;
  dropOffPct: Record<string, number>;
}

export interface PlatformDailyMetrics {
  executive: ExecutiveMetrics;
  orders: OrderAnalyticsMetrics;
  customers: CustomerAnalyticsMetrics;
  riders: RiderAnalyticsMetrics;
  geo: GeoAnalyticsMetrics;
  inventory: InventoryAnalyticsMetrics;
  walletRewards: WalletRewardsMetrics;
  funnel: FunnelMetrics;
}

export interface HourlyMetrics {
  orders: number;
  gmv: number;
  revenue: number;
}

export interface ControlRoomPayload {
  orders: { active: number; today: number; unassigned: number };
  riders: { online: number; busy: number; offline: number };
  deliveries: { inProgress: number; completedToday: number };
  revenue: { today: number; lastHour: number };
  storeActivity: { activeStores: number; preparingOrders: number };
  fraudAlerts: number;
  systemHealth: { api: string; db: string };
  alerts: { id: string; title: string; severity: string }[];
  updatedAt: string;
}
