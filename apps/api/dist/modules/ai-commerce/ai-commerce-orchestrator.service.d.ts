import { DemandForecastService } from './demand-forecast.service';
import { InventoryForecastService } from './inventory-forecast.service';
import { DynamicPricingAIService } from './dynamic-pricing-ai.service';
import { HotspotService } from './hotspot.service';
import { AIRecommendationService } from './ai-recommendation.service';
export declare class AICommerceOrchestratorService {
    private readonly demand;
    private readonly inventory;
    private readonly pricing;
    private readonly hotspots;
    private readonly recommendations;
    constructor(demand: DemandForecastService, inventory: InventoryForecastService, pricing: DynamicPricingAIService, hotspots: HotspotService, recommendations: AIRecommendationService);
    getMerchantOverview(storeIds: string[]): Promise<{
        forecast: ({
            product: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            productId: string;
            forecastDate: Date;
            predictedDemand: number;
            confidenceScore: number;
            actualDemand: number | null;
        })[];
        inventory: ({
            product: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            productId: string;
            daysUntilStockout: number;
            recommendedQty: number;
            urgency: import("@prisma/client").$Enums.InventoryForecastUrgency;
        })[];
        pricing: ({
            product: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.PricingRecommendationStatus;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            productId: string;
            currentPrice: import("@prisma/client/runtime/library").Decimal;
            recommendedPrice: import("@prisma/client/runtime/library").Decimal;
            expectedLiftPercent: number;
        })[];
        opportunities: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            title: string;
            priority: import("@prisma/client").$Enums.AIRecommendationPriority;
            entityType: import("@prisma/client").$Enums.AIRecommendationEntityType;
            entityId: string;
        }[];
        hotspots: ({
            category: {
                name: string;
            } | null;
        } & {
            city: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string | null;
            locality: string;
            demandScore: number;
        })[];
    }>;
    getAdminOverview(): Promise<{
        forecasts: ({
            store: {
                name: string;
            };
            product: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            productId: string;
            forecastDate: Date;
            predictedDemand: number;
            confidenceScore: number;
            actualDemand: number | null;
        })[];
        hotspots: ({
            category: {
                name: string;
            } | null;
        } & {
            city: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string | null;
            locality: string;
            demandScore: number;
        })[];
        accuracy: {
            accuracyPct: number;
            samples: number;
        };
        crises: ({
            store: {
                name: string;
            };
            product: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            productId: string;
            daysUntilStockout: number;
            recommendedQty: number;
            urgency: import("@prisma/client").$Enums.InventoryForecastUrgency;
        })[];
        recommendations: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            title: string;
            priority: import("@prisma/client").$Enums.AIRecommendationPriority;
            entityType: import("@prisma/client").$Enums.AIRecommendationEntityType;
            entityId: string;
        }[];
        trending: {
            category: string;
            demandScore: number;
            city: string;
        }[];
    }>;
    private getTrendingCategories;
}
