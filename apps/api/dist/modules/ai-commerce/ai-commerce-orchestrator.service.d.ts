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
        forecast: any;
        inventory: any;
        pricing: any;
        opportunities: any;
        hotspots: any;
    }>;
    getAdminOverview(): Promise<{
        forecasts: any;
        hotspots: any;
        accuracy: any;
        crises: any;
        recommendations: any;
        trending: any;
    }>;
    private getTrendingCategories;
}
