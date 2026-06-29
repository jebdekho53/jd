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
exports.FranchiseSettlementService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const ledger_service_1 = require("../finance/ledger.service");
const ledger_accounts_constants_1 = require("../finance/ledger-accounts.constants");
const expansion_util_1 = require("./expansion.util");
const order_status_groups_1 = require("../order/order-status-groups");
let FranchiseSettlementService = class FranchiseSettlementService {
    constructor(prisma, ledger) {
        this.prisma = prisma;
        this.ledger = ledger;
    }
    async createSettlement(franchiseId, periodStart, periodEnd) {
        const fp = await this.prisma.franchisePartner.findUnique({
            where: { id: franchiseId },
            include: { stores: true },
        });
        if (!fp)
            throw new common_1.NotFoundException('Franchise not found');
        const storeIds = fp.stores.map((s) => s.storeId);
        const gmvAgg = storeIds.length > 0
            ? await this.prisma.order.aggregate({
                where: {
                    storeId: { in: storeIds },
                    createdAt: { gte: periodStart, lte: periodEnd },
                    status: { notIn: [...order_status_groups_1.BUYER_STATUS_GROUPS.cancelled] },
                },
                _sum: { totalAmount: true },
            })
            : { _sum: { totalAmount: null } };
        const grossGmv = Number(gmvAgg._sum.totalAmount ?? 0);
        const { franchiseShare, platformShare } = (0, expansion_util_1.computeFranchiseShare)(grossGmv, fp.commissionPercent);
        const settlement = await this.prisma.franchiseSettlement.create({
            data: {
                franchiseId,
                periodStart,
                periodEnd,
                grossGmv,
                franchiseShare,
                platformShare,
                status: client_1.FranchiseSettlementStatus.PENDING,
            },
        });
        if (franchiseShare > 0) {
            const journalId = await this.ledger.postJournal({
                referenceType: client_1.LedgerReferenceType.ADJUSTMENT,
                referenceId: settlement.id,
                description: `Franchise settlement ${fp.businessName}`,
                idempotencyKey: `franchise-settlement:${settlement.id}`,
                metadata: { franchiseId, grossGmv, franchiseShare },
                lines: [
                    { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.PLATFORM_COMMISSION, debit: franchiseShare, credit: 0 },
                    { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.MERCHANT_PAYABLE, debit: 0, credit: franchiseShare },
                ],
            });
            await this.prisma.franchiseSettlement.update({
                where: { id: settlement.id },
                data: { ledgerJournalId: journalId, status: client_1.FranchiseSettlementStatus.PROCESSING },
            });
        }
        await this.prisma.franchiseAudit.create({
            data: {
                franchiseId,
                action: client_1.FranchiseAuditAction.SETTLEMENT_CREATED,
                metadata: { settlementId: settlement.id, franchiseShare },
            },
        });
        return settlement;
    }
    async listSettlements(franchiseId) {
        return this.prisma.franchiseSettlement.findMany({
            where: { franchiseId },
            orderBy: { periodEnd: 'desc' },
            take: 24,
        });
    }
    async listAllSettlements() {
        return this.prisma.franchiseSettlement.findMany({
            include: { franchise: { select: { businessName: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
};
exports.FranchiseSettlementService = FranchiseSettlementService;
exports.FranchiseSettlementService = FranchiseSettlementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService])
], FranchiseSettlementService);
//# sourceMappingURL=franchise-settlement.service.js.map