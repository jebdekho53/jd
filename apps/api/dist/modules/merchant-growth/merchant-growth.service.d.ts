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
        healthScore: any;
        breakdown: any;
        metrics: any;
        inventoryHealth: any;
        fulfillmentRate: any;
        cancellationPct: any;
        ratingTrend: any;
        visibilityScore: any;
        actionCenter: import("./growth-recommendations.service").GrowthAction[];
        alerts: any;
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
            impressions: any;
            clicks: any;
            ctr: number;
            addToCart: any;
            orders: any;
            conversionRate: number;
            topSearchedProducts: any;
            lostSearches: any;
        };
        hiddenLocalities: string[];
        tips: (string | null)[];
    }>;
    getOpportunities(userId: string, storeId?: string): Promise<{
        revenue: never[];
        expansion: never[];
        retention: never[];
    } | {
        revenue: any[];
        expansion: ({
            title: string;
            current: any;
            recommended: number;
            city: any;
            topSearches?: undefined;
        } | {
            title: string;
            topSearches: any;
            current?: undefined;
            recommended?: undefined;
            city?: undefined;
        })[];
        retention: {
            repeatCustomers: any;
            loyaltyMembers: any;
            topSpenders: any;
        };
    }>;
    getBenchmark(userId: string, storeId?: string): Promise<{
        store: null;
        platform: null;
        city?: undefined;
        percentile?: undefined;
    } | {
        store: {
            healthScore: any;
            visibilityScore: any;
            cancellationRate: any;
            repeatCustomerPct: any;
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
