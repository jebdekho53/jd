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
        data: any;
    }>;
    inventoryForecast(user: RequestUser, storeId?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    pricingRecs(user: RequestUser, storeId?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    opportunities(user: RequestUser, storeId?: string): Promise<{
        success: boolean;
        data: {
            recommendations: any;
            hotspots: any;
        };
    }>;
}
