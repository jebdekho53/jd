"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantGrowthModule = void 0;
const common_1 = require("@nestjs/common");
const merchant_dashboard_module_1 = require("../merchant-dashboard/merchant-dashboard.module");
const store_review_module_1 = require("../store-review/store-review.module");
const search_discovery_module_1 = require("../search-discovery/search-discovery.module");
const crm_module_1 = require("../crm/crm.module");
const store_health_service_1 = require("./store-health.service");
const growth_recommendations_service_1 = require("./growth-recommendations.service");
const growth_alert_service_1 = require("./growth-alert.service");
const merchant_growth_service_1 = require("./merchant-growth.service");
const admin_merchant_success_service_1 = require("./admin-merchant-success.service");
const merchant_growth_controller_1 = require("./merchant-growth.controller");
const admin_merchant_success_controller_1 = require("./admin-merchant-success.controller");
let MerchantGrowthModule = class MerchantGrowthModule {
};
exports.MerchantGrowthModule = MerchantGrowthModule;
exports.MerchantGrowthModule = MerchantGrowthModule = __decorate([
    (0, common_1.Module)({
        imports: [merchant_dashboard_module_1.MerchantDashboardModule, store_review_module_1.StoreReviewModule, search_discovery_module_1.SearchDiscoveryModule, crm_module_1.CrmModule],
        controllers: [merchant_growth_controller_1.MerchantGrowthController, admin_merchant_success_controller_1.AdminMerchantSuccessController],
        providers: [
            store_health_service_1.StoreHealthService,
            growth_recommendations_service_1.GrowthRecommendationsService,
            growth_alert_service_1.GrowthAlertService,
            merchant_growth_service_1.MerchantGrowthService,
            admin_merchant_success_service_1.AdminMerchantSuccessService,
        ],
        exports: [merchant_growth_service_1.MerchantGrowthService, store_health_service_1.StoreHealthService],
    })
], MerchantGrowthModule);
//# sourceMappingURL=merchant-growth.module.js.map