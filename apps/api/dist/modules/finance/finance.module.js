"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceModule = void 0;
const common_1 = require("@nestjs/common");
const settlement_module_1 = require("../settlement/settlement.module");
const payment_module_1 = require("../payment/payment.module");
const ledger_service_1 = require("./ledger.service");
const finance_commission_service_1 = require("./finance-commission.service");
const order_financials_service_1 = require("./order-financials.service");
const settlement_batch_service_1 = require("./settlement-batch.service");
const cod_reconciliation_service_1 = require("./cod-reconciliation.service");
const rider_payout_service_1 = require("./rider-payout.service");
const finance_export_service_1 = require("./finance-export.service");
const finance_alert_service_1 = require("./finance-alert.service");
const finance_cache_service_1 = require("./finance-cache.service");
const fraud_engine_service_1 = require("./fraud-engine.service");
const finance_service_1 = require("./finance.service");
const admin_finance_controller_1 = require("./admin-finance.controller");
const merchant_finance_controller_1 = require("./merchant-finance.controller");
const rider_finance_controller_1 = require("./rider-finance.controller");
let FinanceModule = class FinanceModule {
};
exports.FinanceModule = FinanceModule;
exports.FinanceModule = FinanceModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => settlement_module_1.SettlementModule), (0, common_1.forwardRef)(() => payment_module_1.PaymentModule)],
        controllers: [admin_finance_controller_1.AdminFinanceController, merchant_finance_controller_1.MerchantFinanceController, rider_finance_controller_1.RiderFinanceController],
        providers: [
            ledger_service_1.LedgerService,
            finance_commission_service_1.FinanceCommissionService,
            order_financials_service_1.OrderFinancialsService,
            settlement_batch_service_1.SettlementBatchService,
            cod_reconciliation_service_1.CodReconciliationService,
            rider_payout_service_1.RiderPayoutService,
            finance_export_service_1.FinanceExportService,
            finance_alert_service_1.FinanceAlertService,
            finance_cache_service_1.FinanceCacheService,
            finance_service_1.FinanceService,
            fraud_engine_service_1.FraudEngineService,
        ],
        exports: [
            ledger_service_1.LedgerService,
            order_financials_service_1.OrderFinancialsService,
            cod_reconciliation_service_1.CodReconciliationService,
            rider_payout_service_1.RiderPayoutService,
            finance_cache_service_1.FinanceCacheService,
            finance_commission_service_1.FinanceCommissionService,
            finance_alert_service_1.FinanceAlertService,
        ],
    })
], FinanceModule);
//# sourceMappingURL=finance.module.js.map