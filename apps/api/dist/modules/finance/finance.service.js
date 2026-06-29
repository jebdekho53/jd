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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const settlement_service_1 = require("../settlement/settlement.service");
const ledger_service_1 = require("./ledger.service");
const finance_cache_service_1 = require("./finance-cache.service");
const finance_alert_service_1 = require("./finance-alert.service");
const cod_reconciliation_service_1 = require("./cod-reconciliation.service");
const settlement_batch_service_1 = require("./settlement-batch.service");
const rider_payout_service_1 = require("./rider-payout.service");
const finance_export_service_1 = require("./finance-export.service");
const settlement_utils_1 = require("../settlement/settlement.utils");
let FinanceService = class FinanceService {
    constructor(prisma, settlement, ledger, cache, alerts, cod, batches, riderPayouts, exports) {
        this.prisma = prisma;
        this.settlement = settlement;
        this.ledger = ledger;
        this.cache = cache;
        this.alerts = alerts;
        this.cod = cod;
        this.batches = batches;
        this.riderPayouts = riderPayouts;
        this.exports = exports;
    }
    async getControlTower() {
        return this.cache.wrap(this.cache.overviewKey(), async () => {
            const [settlementOverview, codSummary, revenue, balances, walletLiability, refunds] = await Promise.all([
                this.settlement.getAdminSettlementsOverview(),
                this.cod.getSummary(),
                this.exports.exportRevenueSummary(),
                this.ledger.getAccountBalances(),
                this.prisma.buyerWallet.aggregate({ _sum: { balance: true } }),
                this.prisma.order.count({
                    where: { status: { in: ['REFUNDED', 'CANCELLED_BY_BUYER'] } },
                }),
            ]);
            return {
                revenue,
                settlement: settlementOverview.summary,
                cod: codSummary,
                ledgerBalances: balances,
                walletLiability: (0, settlement_utils_1.decimalToNumber)(walletLiability._sum.balance),
                refundOrderCount: refunds,
                escrowBalance: balances.find((b) => b.code === 'PLATFORM_ESCROW')?.balance ?? 0,
                merchantPayable: balances.find((b) => b.code === 'MERCHANT_PAYABLE')?.balance ?? 0,
            };
        });
    }
    async getAlerts() {
        return this.alerts.listOpen();
    }
    async runHealthChecks() {
        const [negative, cod] = await Promise.all([
            this.alerts.checkNegativeMerchantBalances(),
            this.alerts.checkCodMismatches(),
        ]);
        return { negativeBalances: negative, codMismatches: cod };
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settlement_service_1.SettlementService,
        ledger_service_1.LedgerService,
        finance_cache_service_1.FinanceCacheService,
        finance_alert_service_1.FinanceAlertService,
        cod_reconciliation_service_1.CodReconciliationService,
        settlement_batch_service_1.SettlementBatchService,
        rider_payout_service_1.RiderPayoutService,
        finance_export_service_1.FinanceExportService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map