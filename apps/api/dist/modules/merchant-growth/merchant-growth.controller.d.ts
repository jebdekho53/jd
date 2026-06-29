import { RequestUser } from '../../common/types';
import { MerchantGrowthService } from './merchant-growth.service';
import { GrowthQueryDto } from './dto/growth.dto';
export declare class MerchantGrowthController {
    private readonly growth;
    constructor(growth: MerchantGrowthService);
    overview(user: RequestUser, query: GrowthQueryDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    recommendations(user: RequestUser, query: GrowthQueryDto): Promise<{
        success: boolean;
        data: {
            recommendations: import("./growth-recommendations.service").GrowthRecommendation[];
        };
    }>;
    visibility(user: RequestUser, query: GrowthQueryDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    opportunities(user: RequestUser, query: GrowthQueryDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    benchmark(user: RequestUser, query: GrowthQueryDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
