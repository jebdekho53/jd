import { PrismaService } from '../../database/prisma.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { SearchAnalyticsService } from '../search-discovery/search-analytics.service';
import { MerchantCrmService } from '../crm/merchant-crm.service';
import { StoreHealthService } from './store-health.service';
import { GrowthRecommendationsService } from './growth-recommendations.service';
import { GrowthAlertService } from './growth-alert.service';
export declare class MerchantGrowthService {
    private readonly prisma;
    private readonly dashboard;
    private readonly health;
    private readonly recommendations;
    private readonly search;
    private readonly crm;
    private readonly alerts;
    constructor(prisma: PrismaService, dashboard: MerchantDashboardService, health: StoreHealthService, recommendations: GrowthRecommendationsService, search: SearchAnalyticsService, crm: MerchantCrmService, alerts: GrowthAlertService);
    private resolveStore;
    getOverview(userId: string, storeId?: string): Promise<{
        healthScore: number;
        breakdown: {};
        metrics: {};
        actionCenter: never[];
        alerts: never[];
        inventoryHealth?: undefined;
        fulfillmentRate?: undefined;
        cancellationPct?: undefined;
        ratingTrend?: undefined;
        visibilityScore?: undefined;
    } | {
        healthScore: number;
        breakdown: import("./store-health.service").HealthBreakdown;
        metrics: {
            fulfillmentRate: number;
            cancellationRate: number;
            averageRating: number;
            ratingTrend: "up" | "down" | "stable";
            lowStockSkus: number;
            outOfStockSkus: number;
            repeatCustomerPct: number;
            avgDeliveryMins: number;
            deliverySlaPct: number;
            visibilityScore: number;
            campaignActivityPct: number;
        };
        inventoryHealth: {
            totalProducts: number;
            activeProducts: number;
            outOfStock: number;
            lowStock: number;
            hiddenProducts: number;
            draftProducts: number;
        };
        fulfillmentRate: number;
        cancellationPct: number;
        ratingTrend: "up" | "down" | "stable";
        visibilityScore: number;
        actionCenter: import("./growth-recommendations.service").GrowthAction[];
        alerts: {
            message: string;
            id: string;
            status: import("@prisma/client").$Enums.AnalyticsAlertStatus;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            storeId: string;
            severity: import("@prisma/client").$Enums.AnalyticsAlertSeverity;
            title: string;
            resolvedAt: Date | null;
            alertType: import("@prisma/client").$Enums.MerchantGrowthAlertType;
        }[];
    }>;
    getRecommendations(userId: string, storeId?: string): Promise<{
        recommendations: import("./growth-recommendations.service").GrowthRecommendation[];
    }>;
    getVisibility(userId: string, storeId?: string): Promise<{
        visibilityScore: number;
        insights: null;
        hiddenLocalities?: undefined;
        tips?: undefined;
    } | {
        visibilityScore: number;
        insights: {
            period: "30d" | "7d";
            impressions: number;
            clicks: number;
            ctr: number;
            addToCart: number;
            orders: number;
            conversionRate: number;
            topSearchedProducts: {
                query: string;
                count: number;
            }[];
            lostSearches: {
                query: string;
                count: number;
            }[];
        };
        hiddenLocalities: string[];
        tips: (string | null)[];
    }>;
    getOpportunities(userId: string, storeId?: string): Promise<{
        revenue: never[];
        expansion: never[];
        retention: never[];
    } | {
        revenue: ({
            title: string;
            count: number;
            type: string;
        } | {
            title: string;
            count: number;
            potential: string;
        } | {
            title: string;
            count: number;
            potential?: undefined;
        })[];
        expansion: ({
            title: string;
            current: number;
            recommended: number;
            city: string | undefined;
            topSearches?: undefined;
        } | {
            title: string;
            topSearches: {
                query: string;
                count: number;
            }[];
            current?: undefined;
            recommended?: undefined;
            city?: undefined;
        })[];
        retention: {
            repeatCustomers: number;
            loyaltyMembers: number;
            topSpenders: {
                userId: string | undefined;
                name: string | undefined;
                phone: string | undefined;
                totalSpent: number;
                orderCount: number;
            }[];
        };
    }>;
    getBenchmark(userId: string, storeId?: string): Promise<{
        store: null;
        platform: null;
        city?: undefined;
        percentile?: undefined;
    } | {
        store: {
            healthScore: number;
            visibilityScore: number;
            cancellationRate: number;
            repeatCustomerPct: number;
        };
        platform: {
            avgHealthScore: number;
            avgVisibility: number;
            avgFulfillmentComponent: number;
        };
        city: {
            avgHealthScore: number;
        };
        percentile: string;
    }>;
    private estimateHiddenLocalities;
}
