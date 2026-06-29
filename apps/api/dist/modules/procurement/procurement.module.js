"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementModule = void 0;
const common_1 = require("@nestjs/common");
const merchant_dashboard_module_1 = require("../merchant-dashboard/merchant-dashboard.module");
const search_discovery_module_1 = require("../search-discovery/search-discovery.module");
const purchase_recommendation_service_1 = require("./purchase-recommendation.service");
const procurement_marketplace_service_1 = require("./procurement-marketplace.service");
const procurement_cart_service_1 = require("./procurement-cart.service");
const procurement_order_service_1 = require("./procurement-order.service");
const procurement_analytics_service_1 = require("./procurement-analytics.service");
const vendor_portal_service_1 = require("./vendor-portal.service");
const admin_supply_chain_service_1 = require("./admin-supply-chain.service");
const merchant_procurement_controller_1 = require("./merchant-procurement.controller");
const vendor_portal_controller_1 = require("./vendor-portal.controller");
const admin_supply_chain_controller_1 = require("./admin-supply-chain.controller");
let ProcurementModule = class ProcurementModule {
};
exports.ProcurementModule = ProcurementModule;
exports.ProcurementModule = ProcurementModule = __decorate([
    (0, common_1.Module)({
        imports: [merchant_dashboard_module_1.MerchantDashboardModule, search_discovery_module_1.SearchDiscoveryModule],
        controllers: [merchant_procurement_controller_1.MerchantProcurementController, vendor_portal_controller_1.VendorPortalController, admin_supply_chain_controller_1.AdminSupplyChainController],
        providers: [
            purchase_recommendation_service_1.PurchaseRecommendationService,
            procurement_marketplace_service_1.ProcurementMarketplaceService,
            procurement_cart_service_1.ProcurementCartService,
            procurement_order_service_1.ProcurementOrderService,
            procurement_analytics_service_1.ProcurementAnalyticsService,
            vendor_portal_service_1.VendorPortalService,
            admin_supply_chain_service_1.AdminSupplyChainService,
        ],
        exports: [purchase_recommendation_service_1.PurchaseRecommendationService, procurement_order_service_1.ProcurementOrderService],
    })
], ProcurementModule);
//# sourceMappingURL=procurement.module.js.map