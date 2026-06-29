import { DemandForecastService } from './demand-forecast.service';
import { HotspotService } from './hotspot.service';
import { InventoryForecastService } from './inventory-forecast.service';
import { DynamicPricingAIService } from './dynamic-pricing-ai.service';
import { AIRecommendationService } from './ai-recommendation.service';
export declare class AICommerceScheduler {
    private readonly demand;
    private readonly hotspots;
    private readonly inventory;
    private readonly pricing;
    private readonly recommendations;
    private readonly logger;
    constructor(demand: DemandForecastService, hotspots: HotspotService, inventory: InventoryForecastService, pricing: DynamicPricingAIService, recommendations: AIRecommendationService);
    hourlyJobs(): Promise<void>;
    dailyJobs(): Promise<void>;
}
