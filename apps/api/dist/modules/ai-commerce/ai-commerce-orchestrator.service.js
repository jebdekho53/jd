"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AICommerceOrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const demand_forecast_service_1 = require("./demand-forecast.service");
const inventory_forecast_service_1 = require("./inventory-forecast.service");
const dynamic_pricing_ai_service_1 = require("./dynamic-pricing-ai.service");
const hotspot_service_1 = require("./hotspot.service");
const ai_recommendation_service_1 = require("./ai-recommendation.service");
let AICommerceOrchestratorService = class AICommerceOrchestratorService {
    constructor(demand, inventory, pricing, hotspots, recommendations) {
        this.demand = demand;
        this.inventory = inventory;
        this.pricing = pricing;
        this.hotspots = hotspots;
        this.recommendations = recommendations;
    }
    async getMerchantOverview(storeIds) {
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
    async getTrendingCategories() {
        const hotspots = await this.hotspots.getHotspots(10);
        return hotspots
            .filter((h) => h.category)
            .map((h) => ({ category: h.category.name, demandScore: h.demandScore, city: h.city }));
    }
};
exports.AICommerceOrchestratorService = AICommerceOrchestratorService;
exports.AICommerceOrchestratorService = AICommerceOrchestratorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [demand_forecast_service_1.DemandForecastService,
        inventory_forecast_service_1.InventoryForecastService,
        dynamic_pricing_ai_service_1.DynamicPricingAIService,
        hotspot_service_1.HotspotService,
        ai_recommendation_service_1.AIRecommendationService])
], AICommerceOrchestratorService);
//# sourceMappingURL=ai-commerce-orchestrator.service.js.map