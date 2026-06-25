import { Injectable } from '@nestjs/common';
import { DemandForecastService } from './demand-forecast.service';
import { InventoryForecastService } from './inventory-forecast.service';
import { DynamicPricingAIService } from './dynamic-pricing-ai.service';
import { HotspotService } from './hotspot.service';
import { AIRecommendationService } from './ai-recommendation.service';

@Injectable()
export class AICommerceOrchestratorService {
  constructor(
    private readonly demand: DemandForecastService,
    private readonly inventory: InventoryForecastService,
    private readonly pricing: DynamicPricingAIService,
    private readonly hotspots: HotspotService,
    private readonly recommendations: AIRecommendationService,
  ) {}

  async getMerchantOverview(storeIds: string[]) {
    const [forecast, inventory, pricing, opportunities, hotspots] = await Promise.all([
      this.demand.getMerchantForecasts(storeIds),
      this.inventory.getMerchantInventory(storeIds),
      this.pricing.getMerchantPricing(storeIds),
      this.recommendations.getForMerchant(storeIds),
      this.hotspots.getHotspots(20),
    ]);
    return { forecast, inventory, pricing, opportunities, hotspots };
  }

  async getAdminOverview() {
    const [forecasts, hotspots, accuracy, crises, recommendations, trending] = await Promise.all([
      this.demand.getAdminForecasts(),
      this.hotspots.getHotspots(30),
      this.demand.getForecastAccuracy(),
      this.inventory.getInventoryCrises(),
      this.recommendations.getAdminRecommendations(),
      this.getTrendingCategories(),
    ]);
    return { forecasts, hotspots, accuracy, crises, recommendations, trending };
  }

  private async getTrendingCategories() {
    const hotspots = await this.hotspots.getHotspots(10);
    return hotspots
      .filter((h) => h.category)
      .map((h) => ({ category: h.category!.name, demandScore: h.demandScore, city: h.city }));
  }
}
