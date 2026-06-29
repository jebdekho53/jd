"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorporateModule = void 0;
const common_1 = require("@nestjs/common");
const finance_module_1 = require("../finance/finance.module");
const corporate_account_service_1 = require("./corporate-account.service");
const approval_service_1 = require("./approval.service");
const corporate_wallet_service_1 = require("./corporate-wallet.service");
const corporate_billing_service_1 = require("./corporate-billing.service");
const corporate_analytics_service_1 = require("./corporate-analytics.service");
const corporate_portal_controller_1 = require("./corporate-portal.controller");
const admin_corporate_controller_1 = require("./admin-corporate.controller");
let CorporateModule = class CorporateModule {
};
exports.CorporateModule = CorporateModule;
exports.CorporateModule = CorporateModule = __decorate([
    (0, common_1.Module)({
        imports: [finance_module_1.FinanceModule],
        controllers: [corporate_portal_controller_1.CorporatePortalController, admin_corporate_controller_1.AdminCorporateController, admin_corporate_controller_1.AdminCorporateAnalyticsController],
        providers: [
            corporate_account_service_1.CorporateAccountService,
            approval_service_1.ApprovalService,
            corporate_wallet_service_1.CorporateWalletService,
            corporate_billing_service_1.CorporateBillingService,
            corporate_analytics_service_1.CorporateAnalyticsService,
        ],
        exports: [corporate_account_service_1.CorporateAccountService, approval_service_1.ApprovalService, corporate_wallet_service_1.CorporateWalletService, corporate_billing_service_1.CorporateBillingService],
    })
], CorporateModule);
//# sourceMappingURL=corporate.module.js.map