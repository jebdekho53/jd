import { AnalyticsSnapshotService } from './analytics-snapshot.service';
import { AnalyticsMetricsCacheService } from './analytics-metrics-cache.service';
import { AnalyticsAggregatorService } from './analytics-aggregator.service';
import { AnalyticsAlertService } from './analytics-alert.service';
import { AnalyticsExportService, type ExportFormat, type ExportRange } from './analytics-export.service';
import { DeliveryTrackingService } from '../delivery-tracking/delivery-tracking.service';
import { PrismaService } from '../../database/prisma.service';
import type { SalesPoint } from './analytics-metrics.types';
export declare class AnalyticsService {
    private readonly snapshots;
    private readonly cache;
    private readonly aggregator;
    private readonly alerts;
    private readonly exportSvc;
    private readonly tracking;
    private readonly prisma;
    constructor(snapshots: AnalyticsSnapshotService, cache: AnalyticsMetricsCacheService, aggregator: AnalyticsAggregatorService, alerts: AnalyticsAlertService, exportSvc: AnalyticsExportService, tracking: DeliveryTrackingService, prisma: PrismaService);
    private getPlatformMetricsForDate;
    private ensureTodaySnapshot;
    getExecutive(): Promise<{
        priorDay: import("./analytics-metrics.types").ExecutiveMetrics | null;
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
        growthPct: {
            gmv: number;
            orders: number;
            revenue: number;
        };
        asOf: string;
        source: string;
    }>;
    getSales(granularity: string, compare?: string): Promise<{
        granularity: string;
        series: SalesPoint[];
        comparisons: {
            current: {
                orders: number;
                gmv: number;
            };
            previous: {
                orders: number;
                gmv: number;
            };
            label: string;
        } | null;
        source: string;
    }>;
    private buildSalesSeries;
    private buildComparisons;
    getOrders(): Promise<{
        created: number;
        completed: number;
        cancelled: number;
        returned: number;
        codPct: number;
        walletPct: number;
        razorpayPct: number;
        avgDeliveryMins: number;
        avgPrepMins: number;
        source: string;
    }>;
    getCustomers(): Promise<{
        newCustomers: number;
        returningCustomers: number;
        retentionPct: number;
        repeatPurchasePct: number;
        topCustomers: {
            name: string;
            orders: number;
            spend: number;
        }[];
        walletUsers: number;
        tierDistribution: {
            tier: string;
            count: number;
        }[];
        referralPerformance: {
            completed: number;
            pending: number;
        };
        source: string;
    }>;
    getMerchants(): Promise<{
        source: string;
        topStores: any;
    }>;
    getRiders(): Promise<{
        deliveriesCompleted: number;
        avgDeliveryMins: number;
        acceptanceRate: number;
        rejectionRate: number;
        activeHours: number;
        distanceCoveredKm: number;
        revenueGenerated: number;
        topRiders: {
            riderId: string;
            name: string;
            deliveries: number;
        }[];
        lowPerformingRiders: {
            riderId: string;
            name: string;
            deliveries: number;
            lateRate: number;
        }[];
        source: string;
    }>;
    getGeo(): Promise<{
        topCities: {
            name: string;
            count: number;
            revenue: number;
        }[];
        topAreas: {
            name: string;
            count: number;
            revenue: number;
        }[];
        topLocalities: {
            name: string;
            count: number;
            revenue: number;
        }[];
        highDemandZones: {
            key: string;
            count: number;
        }[];
        lowCoverageZones: {
            key: string;
            storeCount: number;
            orderCount: number;
        }[];
        deliveryHeatmap: {
            lat: number;
            lng: number;
            weight: number;
        }[];
        storeDensity: number;
        riderDensity: number;
        source: string;
    }>;
    getInventory(): Promise<{
        fastMoving: {
            name: string;
            soldQty: number;
        }[];
        slowMoving: {
            name: string;
            availableQty: number;
        }[];
        lowStockRisk: number;
        deadInventory: number;
        inventoryTurnover: number;
        lostSalesOos: number;
        source: string;
    }>;
    getWalletRewards(): Promise<{
        walletCredits: number;
        walletDebits: number;
        outstandingLiability: number;
        rewardIssued: number;
        rewardRedeemed: number;
        rewardExpired: number;
        referralPerformance: {
            completed: number;
            pending: number;
        };
        tierUpgrades: number;
        source: string;
    }>;
    getFunnel(): Promise<{
        visitors: number;
        searches: number;
        storeViews: number;
        productViews: number;
        addToCart: number;
        checkoutStarted: number;
        orderCreated: number;
        orderCompleted: number;
        dropOffPct: Record<string, number>;
        source: string;
    }>;
    getAlerts(): Promise<{
        source: string;
        alerts: any;
    }>;
    acknowledgeAlert(id: string): Promise<any>;
    exportData(format: ExportFormat, range: ExportRange, type: string, from?: string, to?: string): Promise<{
        content: string;
        mime: string;
        filename: string;
    }>;
    getControlRoom(): Promise<{
        orders: {
            active: any;
            today: any;
            unassigned: any;
        };
        riders: {
            online: any;
            busy: any;
            offline: any;
        };
        deliveries: {
            inProgress: any;
            completedToday: any;
        };
        revenue: {
            today: number;
            lastHour: number;
        };
        storeActivity: {
            activeStores: any;
            preparingOrders: any;
        };
        fraudAlerts: any;
        systemHealth: {
            api: string;
            db: string;
        };
        alerts: any[];
        updatedAt: string;
    }>;
    getMerchantSnapshot(storeId: string, period?: '7d' | '30d'): Promise<{
        source: string;
        period: "30d" | "7d";
        series: any;
        rollup: any;
    }>;
}
