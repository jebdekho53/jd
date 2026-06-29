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
var SettlementBatchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementBatchService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
const ledger_service_1 = require("./ledger.service");
const finance_cache_service_1 = require("./finance-cache.service");
const finance_alert_service_1 = require("./finance-alert.service");
const distributed_lock_service_1 = require("../../redis/distributed-lock.service");
const settlement_utils_1 = require("../settlement/settlement.utils");
let SettlementBatchService = SettlementBatchService_1 = class SettlementBatchService {
    constructor(prisma, ledger, cache, alerts, lock) {
        this.prisma = prisma;
        this.ledger = ledger;
        this.cache = cache;
        this.alerts = alerts;
        this.lock = lock;
        this.logger = new common_1.Logger(SettlementBatchService_1.name);
    }
    async runDailySettlements() {
        await this.lock.runExclusive('cron:settlement-daily', 3600, async () => {
            await this.generateBatches(client_1.SettlementCycle.DAILY);
        });
    }
    async runWeeklySettlements() {
        await this.lock.runExclusive('cron:settlement-weekly', 3600, async () => {
            await this.generateBatches(client_1.SettlementCycle.WEEKLY);
        });
    }
    async generateBatches(cycle, merchantProfileId) {
        const { periodStart, periodEnd } = this.periodForCycle(cycle);
        const merchants = merchantProfileId
            ? [{ merchantProfileId }]
            : await this.prisma.settlementLedger.groupBy({
                by: ['merchantProfileId'],
                where: {
                    status: client_1.SettlementLedgerStatus.SETTLED,
                    settledAt: { gte: periodStart, lte: periodEnd },
                },
            });
        let created = 0;
        for (const m of merchants) {
            try {
                const batch = await this.createBatchForMerchant(m.merchantProfileId, cycle, periodStart, periodEnd);
                if (batch)
                    created += 1;
            }
            catch (err) {
                this.logger.error({ err, merchantProfileId: m.merchantProfileId }, 'Settlement batch failed');
                await this.alerts.raiseSettlementFailure(m.merchantProfileId, err.message);
            }
        }
        if (created > 0)
            await this.cache.invalidateSettlements();
        return created;
    }
    async createBatchForMerchant(merchantProfileId, cycle, periodStart, periodEnd) {
        const ledgers = await this.prisma.settlementLedger.findMany({
            where: {
                merchantProfileId,
                status: client_1.SettlementLedgerStatus.SETTLED,
                settledAt: { gte: periodStart, lte: periodEnd },
                settlementItems: { none: {} },
            },
        });
        if (ledgers.length === 0)
            return null;
        const gross = (0, settlement_utils_1.roundMoney)(ledgers.reduce((s, l) => s + (0, settlement_utils_1.decimalToNumber)(l.grossAmount), 0));
        const commission = (0, settlement_utils_1.roundMoney)(ledgers.reduce((s, l) => s + (0, settlement_utils_1.decimalToNumber)(l.platformCommission), 0));
        const net = (0, settlement_utils_1.roundMoney)(ledgers.reduce((s, l) => s + (0, settlement_utils_1.decimalToNumber)(l.netAmount), 0));
        const settlement = await this.prisma.$transaction(async (tx) => {
            const batch = await tx.settlement.create({
                data: {
                    merchantProfileId,
                    cycle,
                    status: client_1.SettlementBatchStatus.COMPLETED,
                    periodStart,
                    periodEnd,
                    grossAmount: gross,
                    commissionAmount: commission,
                    netAmount: net,
                    itemCount: ledgers.length,
                    processedAt: new Date(),
                    items: {
                        create: ledgers.map((l) => ({
                            orderId: l.orderId,
                            settlementLedgerId: l.id,
                            grossAmount: l.grossAmount,
                            commissionAmount: l.platformCommission,
                            netAmount: l.netAmount,
                        })),
                    },
                },
                include: { items: true },
            });
            return batch;
        });
        for (const l of ledgers) {
            await this.ledger.recordMerchantSettlement(l.orderId, merchantProfileId, (0, settlement_utils_1.decimalToNumber)(l.grossAmount), (0, settlement_utils_1.decimalToNumber)(l.platformCommission), (0, settlement_utils_1.decimalToNumber)(l.netAmount));
        }
        return settlement;
    }
    async listSettlements(merchantProfileId, page = 1, limit = 20) {
        const where = merchantProfileId ? { merchantProfileId } : {};
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.settlement.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    merchantProfile: { select: { businessName: true } },
                    _count: { select: { items: true } },
                },
            }),
            this.prisma.settlement.count({ where }),
        ]);
        return {
            settlements: rows.map((s) => ({
                id: s.id,
                merchant: s.merchantProfile.businessName,
                merchantProfileId: s.merchantProfileId,
                cycle: s.cycle,
                status: s.status,
                grossAmount: (0, settlement_utils_1.decimalToNumber)(s.grossAmount),
                commissionAmount: (0, settlement_utils_1.decimalToNumber)(s.commissionAmount),
                netAmount: (0, settlement_utils_1.decimalToNumber)(s.netAmount),
                itemCount: s._count.items,
                periodStart: s.periodStart.toISOString(),
                periodEnd: s.periodEnd.toISOString(),
                processedAt: s.processedAt?.toISOString() ?? null,
            })),
            meta: { page, limit, total },
        };
    }
    periodForCycle(cycle) {
        const end = new Date();
        const start = cycle === client_1.SettlementCycle.DAILY ? (0, ist_day_util_1.startOfIstDay)() : (0, ist_day_util_1.daysAgoIst)(7);
        return { periodStart: start, periodEnd: end };
    }
};
exports.SettlementBatchService = SettlementBatchService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_1AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettlementBatchService.prototype, "runDailySettlements", null);
__decorate([
    (0, schedule_1.Cron)('0 2 * * 1'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettlementBatchService.prototype, "runWeeklySettlements", null);
exports.SettlementBatchService = SettlementBatchService = SettlementBatchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        finance_cache_service_1.FinanceCacheService,
        finance_alert_service_1.FinanceAlertService,
        distributed_lock_service_1.DistributedLockService])
], SettlementBatchService);
//# sourceMappingURL=settlement-batch.service.js.map