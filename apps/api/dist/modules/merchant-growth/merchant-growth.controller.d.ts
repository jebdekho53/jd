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
        };
    }>;
    opportunities(user: RequestUser, query: GrowthQueryDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
