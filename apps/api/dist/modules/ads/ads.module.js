"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdsModule = void 0;
const common_1 = require("@nestjs/common");
const merchant_dashboard_module_1 = require("../merchant-dashboard/merchant-dashboard.module");
const trust_safety_module_1 = require("../trust-safety/trust-safety.module");
const crm_module_1 = require("../crm/crm.module");
const ad_serving_service_1 = require("./ad-serving.service");
const keyword_auction_service_1 = require("./keyword-auction.service");
const ad_analytics_service_1 = require("./ad-analytics.service");
const ad_budget_service_1 = require("./ad-budget.service");
const ad_fraud_guard_service_1 = require("./ad-fraud-guard.service");
const merchant_ads_controller_1 = require("./merchant-ads.controller");
const admin_ads_controller_1 = require("./admin-ads.controller");
let AdsModule = class AdsModule {
};
exports.AdsModule = AdsModule;
exports.AdsModule = AdsModule = __decorate([
    (0, common_1.Module)({
        imports: [merchant_dashboard_module_1.MerchantDashboardModule, trust_safety_module_1.TrustSafetyModule, crm_module_1.CrmModule],
        controllers: [merchant_ads_controller_1.MerchantAdsController, admin_ads_controller_1.AdminAdsController, admin_ads_controller_1.AdminAdsAnalyticsController],
        providers: [
            ad_serving_service_1.AdServingService,
            keyword_auction_service_1.KeywordAuctionService,
            ad_analytics_service_1.AdAnalyticsService,
            ad_budget_service_1.AdBudgetService,
            ad_fraud_guard_service_1.AdFraudGuardService,
        ],
        exports: [ad_serving_service_1.AdServingService, keyword_auction_service_1.KeywordAuctionService, ad_analytics_service_1.AdAnalyticsService, ad_budget_service_1.AdBudgetService],
    })
], AdsModule);
//# sourceMappingURL=ads.module.js.map