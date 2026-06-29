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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantAIController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const merchant_dashboard_service_1 = require("../merchant-dashboard/merchant-dashboard.service");
const ai_commerce_orchestrator_service_1 = require("./ai-commerce-orchestrator.service");
const demand_forecast_service_1 = require("./demand-forecast.service");
const inventory_forecast_service_1 = require("./inventory-forecast.service");
const dynamic_pricing_ai_service_1 = require("./dynamic-pricing-ai.service");
const ai_recommendation_service_1 = require("./ai-recommendation.service");
let MerchantAIController = class MerchantAIController {
    constructor(merchantDashboard, orchestrator, demand, inventorySvc, pricing, recommendations) {
        this.merchantDashboard = merchantDashboard;
        this.orchestrator = orchestrator;
        this.demand = demand;
        this.inventorySvc = inventorySvc;
        this.pricing = pricing;
        this.recommendations = recommendations;
    }
    async storeIds(userId, storeId) {
        const ctx = await this.merchantDashboard.resolveStoreContext(userId, storeId);
        return ctx.storeIds;
    }
    async forecast(user, storeId) {
        const ids = await this.storeIds(user.id, storeId);
        return { success: true, data: await this.demand.getMerchantForecasts(ids) };
    }
    async inventoryForecast(user, storeId) {
        const ids = await this.storeIds(user.id, storeId);
        return { success: true, data: await this.inventorySvc.getMerchantInventory(ids) };
    }
    async pricingRecs(user, storeId) {
        const ids = await this.storeIds(user.id, storeId);
        return { success: true, data: await this.pricing.getMerchantPricing(ids) };
    }
    async opportunities(user, storeId) {
        const ids = await this.storeIds(user.id, storeId);
        const data = await this.orchestrator.getMerchantOverview(ids);
        return {
            success: true,
            data: {
                recommendations: data.opportunities,
                hotspots: data.hotspots,
            },
        };
    }
};
exports.MerchantAIController = MerchantAIController;
__decorate([
    (0, common_1.Get)('forecast'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantAIController.prototype, "forecast", null);
__decorate([
    (0, common_1.Get)('inventory'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantAIController.prototype, "inventoryForecast", null);
__decorate([
    (0, common_1.Get)('pricing'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantAIController.prototype, "pricingRecs", null);
__decorate([
    (0, common_1.Get)('opportunities'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantAIController.prototype, "opportunities", null);
exports.MerchantAIController = MerchantAIController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/ai'),
    __metadata("design:paramtypes", [merchant_dashboard_service_1.MerchantDashboardService,
        ai_commerce_orchestrator_service_1.AICommerceOrchestratorService,
        demand_forecast_service_1.DemandForecastService,
        inventory_forecast_service_1.InventoryForecastService,
        dynamic_pricing_ai_service_1.DynamicPricingAIService,
        ai_recommendation_service_1.AIRecommendationService])
], MerchantAIController);
//# sourceMappingURL=merchant-ai.controller.js.map