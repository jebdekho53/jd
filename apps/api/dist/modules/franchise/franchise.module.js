"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FranchiseModule = void 0;
const common_1 = require("@nestjs/common");
const finance_module_1 = require("../finance/finance.module");
const merchant_dashboard_module_1 = require("../merchant-dashboard/merchant-dashboard.module");
const franchise_service_1 = require("./franchise.service");
const territory_service_1 = require("./territory.service");
const expansion_service_1 = require("./expansion.service");
const franchise_analytics_service_1 = require("./franchise-analytics.service");
const franchise_settlement_service_1 = require("./franchise-settlement.service");
const franchise_expansion_merchant_service_1 = require("./franchise-expansion-merchant.service");
const admin_expansion_controller_1 = require("./admin-expansion.controller");
const franchise_portal_controller_1 = require("./franchise-portal.controller");
const merchant_franchise_expansion_controller_1 = require("./merchant-franchise-expansion.controller");
let FranchiseModule = class FranchiseModule {
};
exports.FranchiseModule = FranchiseModule;
exports.FranchiseModule = FranchiseModule = __decorate([
    (0, common_1.Module)({
        imports: [finance_module_1.FinanceModule, merchant_dashboard_module_1.MerchantDashboardModule],
        controllers: [
            admin_expansion_controller_1.AdminExpansionController,
            admin_expansion_controller_1.AdminFranchiseAnalyticsController,
            franchise_portal_controller_1.FranchisePortalController,
            merchant_franchise_expansion_controller_1.MerchantFranchiseExpansionController,
        ],
        providers: [
            franchise_service_1.FranchiseService,
            territory_service_1.TerritoryService,
            expansion_service_1.ExpansionService,
            franchise_analytics_service_1.FranchiseAnalyticsService,
            franchise_settlement_service_1.FranchiseSettlementService,
            franchise_expansion_merchant_service_1.FranchiseExpansionMerchantService,
        ],
        exports: [territory_service_1.TerritoryService, expansion_service_1.ExpansionService, franchise_analytics_service_1.FranchiseAnalyticsService],
    })
], FranchiseModule);
//# sourceMappingURL=franchise.module.js.map