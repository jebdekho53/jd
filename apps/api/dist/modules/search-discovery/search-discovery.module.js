"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchDiscoveryModule = void 0;
const common_1 = require("@nestjs/common");
const buyer_module_1 = require("../buyer/buyer.module");
const cart_module_1 = require("../cart/cart.module");
const merchant_dashboard_module_1 = require("../merchant-dashboard/merchant-dashboard.module");
const ads_module_1 = require("../ads/ads.module");
const seo_module_1 = require("../seo/seo.module");
const search_discovery_service_1 = require("./search-discovery.service");
const search_cache_service_1 = require("./search-cache.service");
const search_analytics_service_1 = require("./search-analytics.service");
const buyer_search_controller_1 = require("./buyer-search.controller");
const admin_search_analytics_controller_1 = require("./admin-search-analytics.controller");
const merchant_search_insights_controller_1 = require("./merchant-search-insights.controller");
let SearchDiscoveryModule = class SearchDiscoveryModule {
};
exports.SearchDiscoveryModule = SearchDiscoveryModule;
exports.SearchDiscoveryModule = SearchDiscoveryModule = __decorate([
    (0, common_1.Module)({
        imports: [buyer_module_1.BuyerModule, cart_module_1.CartModule, merchant_dashboard_module_1.MerchantDashboardModule, ads_module_1.AdsModule, seo_module_1.SeoModule],
        controllers: [
            buyer_search_controller_1.BuyerSearchController,
            buyer_search_controller_1.BuyerDiscoverController,
            admin_search_analytics_controller_1.AdminSearchAnalyticsController,
            merchant_search_insights_controller_1.MerchantSearchInsightsController,
        ],
        providers: [search_discovery_service_1.SearchDiscoveryService, search_cache_service_1.SearchCacheService, search_analytics_service_1.SearchAnalyticsService],
        exports: [search_discovery_service_1.SearchDiscoveryService, search_cache_service_1.SearchCacheService, search_analytics_service_1.SearchAnalyticsService],
    })
], SearchDiscoveryModule);
//# sourceMappingURL=search-discovery.module.js.map