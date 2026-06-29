"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AICommerceModule = void 0;
const common_1 = require("@nestjs/common");
const merchant_dashboard_module_1 = require("../merchant-dashboard/merchant-dashboard.module");
const demand_forecast_service_1 = require("./demand-forecast.service");
const inventory_forecast_service_1 = require("./inventory-forecast.service");
const dynamic_pricing_ai_service_1 = require("./dynamic-pricing-ai.service");
const hotspot_service_1 = require("./hotspot.service");
const ai_recommendation_service_1 = require("./ai-recommendation.service");
const ai_commerce_orchestrator_service_1 = require("./ai-commerce-orchestrator.service");
const ai_commerce_scheduler_1 = require("./ai-commerce.scheduler");
const merchant_ai_controller_1 = require("./merchant-ai.controller");
const admin_ai_commerce_controller_1 = require("./admin-ai-commerce.controller");
let AICommerceModule = class AICommerceModule {
};
exports.AICommerceModule = AICommerceModule;
exports.AICommerceModule = AICommerceModule = __decorate([
    (0, common_1.Module)({
        imports: [merchant_dashboard_module_1.MerchantDashboardModule],
        controllers: [merchant_ai_controller_1.MerchantAIController, admin_ai_commerce_controller_1.AdminAICommerceController],
        providers: [
            demand_forecast_service_1.DemandForecastService,
            inventory_forecast_service_1.InventoryForecastService,
            dynamic_pricing_ai_service_1.DynamicPricingAIService,
            hotspot_service_1.HotspotService,
            ai_recommendation_service_1.AIRecommendationService,
            ai_commerce_orchestrator_service_1.AICommerceOrchestratorService,
            ai_commerce_scheduler_1.AICommerceScheduler,
        ],
        exports: [demand_forecast_service_1.DemandForecastService, hotspot_service_1.HotspotService, inventory_forecast_service_1.InventoryForecastService],
    })
], AICommerceModule);
//# sourceMappingURL=ai-commerce.module.js.map