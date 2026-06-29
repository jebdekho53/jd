"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementModule = void 0;
const common_1 = require("@nestjs/common");
const settlement_service_1 = require("./settlement.service");
const settlement_commission_service_1 = require("./settlement-commission.service");
const settlement_automation_service_1 = require("./settlement-automation.service");
const merchant_settlement_controller_1 = require("./merchant-settlement.controller");
const admin_settlement_controller_1 = require("./admin-settlement.controller");
const finance_module_1 = require("../finance/finance.module");
let SettlementModule = class SettlementModule {
};
exports.SettlementModule = SettlementModule;
exports.SettlementModule = SettlementModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => finance_module_1.FinanceModule)],
        controllers: [merchant_settlement_controller_1.MerchantSettlementController, admin_settlement_controller_1.AdminSettlementController],
        providers: [settlement_service_1.SettlementService, settlement_commission_service_1.SettlementCommissionService, settlement_automation_service_1.SettlementAutomationService],
        exports: [settlement_service_1.SettlementService, settlement_commission_service_1.SettlementCommissionService],
    })
], SettlementModule);
//# sourceMappingURL=settlement.module.js.map