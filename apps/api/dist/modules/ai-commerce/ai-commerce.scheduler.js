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
var AICommerceScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AICommerceScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const demand_forecast_service_1 = require("./demand-forecast.service");
const hotspot_service_1 = require("./hotspot.service");
const inventory_forecast_service_1 = require("./inventory-forecast.service");
const dynamic_pricing_ai_service_1 = require("./dynamic-pricing-ai.service");
const ai_recommendation_service_1 = require("./ai-recommendation.service");
let AICommerceScheduler = AICommerceScheduler_1 = class AICommerceScheduler {
    constructor(demand, hotspots, inventory, pricing, recommendations) {
        this.demand = demand;
        this.hotspots = hotspots;
        this.inventory = inventory;
        this.pricing = pricing;
        this.recommendations = recommendations;
        this.logger = new common_1.Logger(AICommerceScheduler_1.name);
    }
    async hourlyJobs() {
        try {
            await this.demand.runAllForecasts();
            await this.hotspots.generateHotspots();
        }
        catch (err) {
            this.logger.error('Hourly AI commerce jobs failed', err instanceof Error ? err.stack : String(err));
        }
    }
    async dailyJobs() {
        try {
            await this.inventory.runAllForecasts();
            await this.pricing.runAllRecommendations();
            await this.recommendations.generateAll();
        }
        catch (err) {
            this.logger.error('Daily AI commerce jobs failed', err instanceof Error ? err.stack : String(err));
        }
    }
};
exports.AICommerceScheduler = AICommerceScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AICommerceScheduler.prototype, "hourlyJobs", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_4AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AICommerceScheduler.prototype, "dailyJobs", null);
exports.AICommerceScheduler = AICommerceScheduler = AICommerceScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [demand_forecast_service_1.DemandForecastService,
        hotspot_service_1.HotspotService,
        inventory_forecast_service_1.InventoryForecastService,
        dynamic_pricing_ai_service_1.DynamicPricingAIService,
        ai_recommendation_service_1.AIRecommendationService])
], AICommerceScheduler);
//# sourceMappingURL=ai-commerce.scheduler.js.map