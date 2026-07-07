import { RequestUser } from '../../common/types';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { AICommerceOrchestratorService } from './ai-commerce-orchestrator.service';
import { DemandForecastService } from './demand-forecast.service';
import { InventoryForecastService } from './inventory-forecast.service';
import { DynamicPricingAIService } from './dynamic-pricing-ai.service';
import { AIRecommendationService } from './ai-recommendation.service';
export declare class MerchantAIController {
    private readonly merchantDashboard;
    private readonly orchestrator;
    private readonly demand;
    private readonly inventorySvc;
    private readonly pricing;
    private readonly recommendations;
    constructor(merchantDashboard: MerchantDashboardService, orchestrator: AICommerceOrchestratorService, demand: DemandForecastService, inventorySvc: InventoryForecastService, pricing: DynamicPricingAIService, recommendations: AIRecommendationService);
    private storeIds;
    forecast(user: RequestUser, storeId?: string): Promise<{
        success: boolean;
        data: ({
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
    }>;
    inventoryForecast(user: RequestUser, storeId?: string): Promise<{
        success: boolean;
        data: ({
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
    }>;
    pricingRecs(user: RequestUser, storeId?: string): Promise<{
        success: boolean;
        data: ({
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
    }>;
    opportunities(user: RequestUser, storeId?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
