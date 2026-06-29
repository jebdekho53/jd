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
exports.CodReconciliationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const ledger_service_1 = require("./ledger.service");
const finance_alert_service_1 = require("./finance-alert.service");
const settlement_utils_1 = require("../settlement/settlement.utils");
let CodReconciliationService = class CodReconciliationService {
    constructor(prisma, ledger, alerts) {
        this.prisma = prisma;
        this.ledger = ledger;
        this.alerts = alerts;
    }
    async createForDeliveredOrder(orderId, riderProfileId, providerType) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, totalAmount: true, paymentMethod: true },
        });
        if (!order)
            return;
        const isCod = order.paymentMethod === client_1.PaymentMethod.COD ||
            order.paymentMethod === client_1.PaymentMethod.WALLET_COD;
        if (!isCod)
            return;
        const existing = await this.prisma.codReconciliation.findFirst({
            where: { orderId },
        });
        if (existing)
            return;
        if (!riderProfileId && !providerType) {
            return;
        }
        await this.prisma.codReconciliation.create({
            data: {
                riderProfileId: riderProfileId ?? undefined,
                providerType: providerType ?? undefined,
                orderId,
                amountExpected: order.totalAmount,
                amountCollected: order.totalAmount,
                status: client_1.CodReconciliationStatus.PENDING,
            },
        });
    }
    async submitRemittance(riderProfileId, input) {
        const records = await this.prisma.codReconciliation.findMany({
            where: {
                riderProfileId,
                orderId: { in: input.orderIds },
                status: client_1.CodReconciliationStatus.PENDING,
            },
        });
        if (records.length === 0)
            throw new common_1.BadRequestException('No pending COD records found');
        const expected = (0, settlement_utils_1.roundMoney)(records.reduce((s, r) => s + (0, settlement_utils_1.decimalToNumber)(r.amountExpected), 0));
        const mismatch = (0, settlement_utils_1.roundMoney)(Math.abs(expected - input.amountDeposited));
        const now = new Date();
        await this.prisma.$transaction(records.map((r) => this.prisma.codReconciliation.update({
            where: { id: r.id },
            data: {
                status: client_1.CodReconciliationStatus.SUBMITTED,
                amountDeposited: input.amountDeposited / records.length,
                mismatchAmount: mismatch / records.length,
                submittedAt: now,
                notes: input.notes,
            },
        })));
        if (mismatch > 1) {
            await this.alerts.raiseCodMismatch(riderProfileId, mismatch);
        }
        return { submitted: records.length, expected, deposited: input.amountDeposited, mismatch };
    }
    async verify(adminUserId, id) {
        const record = await this.prisma.codReconciliation.findUnique({ where: { id } });
        if (!record)
            throw new common_1.NotFoundException('COD record not found');
        if (record.status !== client_1.CodReconciliationStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Only submitted remittances can be verified');
        }
        const updated = await this.prisma.codReconciliation.update({
            where: { id },
            data: {
                status: client_1.CodReconciliationStatus.VERIFIED,
                verifiedAt: new Date(),
                verifiedBy: adminUserId,
            },
        });
        const amount = (0, settlement_utils_1.decimalToNumber)(updated.amountDeposited);
        if (amount > 0 && updated.orderId) {
            await this.ledger.postJournal({
                referenceType: client_1.LedgerReferenceType.COD_REMITTANCE,
                referenceId: id,
                orderId: updated.orderId,
                description: `COD remittance verified ${id}`,
                idempotencyKey: `cod-remit:${id}`,
                lines: [
                    { accountCode: 'PLATFORM_ESCROW', debit: amount, credit: 0 },
                    { accountCode: 'COD_COLLECTED', debit: 0, credit: amount },
                ],
            });
        }
        return updated;
    }
    async reject(adminUserId, id, reason) {
        const record = await this.prisma.codReconciliation.findUnique({ where: { id } });
        if (!record)
            throw new common_1.NotFoundException('COD record not found');
        return this.prisma.codReconciliation.update({
            where: { id },
            data: {
                status: client_1.CodReconciliationStatus.REJECTED,
                verifiedBy: adminUserId,
                verifiedAt: new Date(),
                rejectionReason: reason,
            },
        });
    }
    async listAdmin(status, page = 1, limit = 25) {
        const where = status ? { status } : {};
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.codReconciliation.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    riderProfile: { select: { name: true } },
                    order: { select: { orderNumber: true } },
                },
            }),
            this.prisma.codReconciliation.count({ where }),
        ]);
        return {
            records: rows.map((r) => ({
                id: r.id,
                rider: r.riderProfile?.name ?? (r.providerType ? `Provider ${r.providerType}` : 'Unknown'),
                orderNumber: r.order?.orderNumber ?? null,
                amountExpected: (0, settlement_utils_1.decimalToNumber)(r.amountExpected),
                amountCollected: (0, settlement_utils_1.decimalToNumber)(r.amountCollected),
                amountDeposited: (0, settlement_utils_1.decimalToNumber)(r.amountDeposited),
                mismatchAmount: (0, settlement_utils_1.decimalToNumber)(r.mismatchAmount),
                status: r.status,
                submittedAt: r.submittedAt?.toISOString() ?? null,
            })),
            meta: { page, limit, total },
        };
    }
    async getSummary() {
        const [pending, submitted, verified, rejected] = await Promise.all([
            this.prisma.codReconciliation.aggregate({
                where: { status: client_1.CodReconciliationStatus.PENDING },
                _sum: { amountExpected: true },
                _count: { id: true },
            }),
            this.prisma.codReconciliation.aggregate({
                where: { status: client_1.CodReconciliationStatus.SUBMITTED },
                _sum: { amountExpected: true },
                _count: { id: true },
            }),
            this.prisma.codReconciliation.aggregate({
                where: { status: client_1.CodReconciliationStatus.VERIFIED },
                _sum: { amountDeposited: true },
                _count: { id: true },
            }),
            this.prisma.codReconciliation.count({
                where: { status: client_1.CodReconciliationStatus.REJECTED, mismatchAmount: { gt: 0 } },
            }),
        ]);
        return {
            codPending: (0, settlement_utils_1.decimalToNumber)(pending._sum.amountExpected),
            codPendingCount: pending._count.id,
            codSubmitted: (0, settlement_utils_1.decimalToNumber)(submitted._sum.amountExpected),
            codSubmittedCount: submitted._count.id,
            codDeposited: (0, settlement_utils_1.decimalToNumber)(verified._sum.amountDeposited),
            codVerifiedCount: verified._count.id,
            mismatchCount: rejected,
        };
    }
};
exports.CodReconciliationService = CodReconciliationService;
exports.CodReconciliationService = CodReconciliationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        finance_alert_service_1.FinanceAlertService])
], CodReconciliationService);
//# sourceMappingURL=cod-reconciliation.service.js.map