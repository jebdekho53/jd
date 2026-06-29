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
var SettlementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
const audit_service_1 = require("../audit/audit.service");
const settlement_commission_service_1 = require("./settlement-commission.service");
const finance_commission_service_1 = require("../finance/finance-commission.service");
const ledger_service_1 = require("../finance/ledger.service");
const finance_cache_service_1 = require("../finance/finance-cache.service");
const settlement_utils_1 = require("./settlement.utils");
let SettlementService = SettlementService_1 = class SettlementService {
    constructor(prisma, commission, financeCommission, ledger, financeCache, audit) {
        this.prisma = prisma;
        this.commission = commission;
        this.financeCommission = financeCommission;
        this.ledger = ledger;
        this.financeCache = financeCache;
        this.audit = audit;
        this.logger = new common_1.Logger(SettlementService_1.name);
    }
    async createLedgerForDeliveredOrder(orderId, actorId) {
        const existing = await this.prisma.settlementLedger.findUnique({
            where: { orderId },
            select: { id: true },
        });
        if (existing) {
            this.logger.debug(`Settlement already exists for order ${orderId}`);
            return;
        }
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                orderNumber: true,
                storeId: true,
                subtotal: true,
                deliveryFee: true,
                taxAmount: true,
                status: true,
                store: { select: { merchantProfileId: true } },
                financialSnapshot: true,
            },
        });
        if (!order?.store?.merchantProfileId) {
            this.logger.warn(`No merchant for order ${orderId}, skipping settlement`);
            return;
        }
        const merchantProfileId = order.store.merchantProfileId;
        const snapshot = order.financialSnapshot;
        const commissionPercent = snapshot
            ? (0, settlement_utils_1.decimalToNumber)(snapshot.commissionPercent)
            : (await this.financeCommission.resolveForOrder(order.storeId, orderId)).commissionPercent;
        const settlementDelay = snapshot
            ? 2
            : (await this.commission.resolveForOrder(merchantProfileId, orderId)).settlementDelayDays;
        const grossAmount = snapshot
            ? (0, settlement_utils_1.decimalToNumber)(snapshot.subtotal)
            : (0, settlement_utils_1.decimalToNumber)(order.subtotal);
        const deliveryFee = (0, settlement_utils_1.decimalToNumber)(order.deliveryFee);
        const taxAmount = (0, settlement_utils_1.decimalToNumber)(order.taxAmount);
        const platformCommission = snapshot
            ? (0, settlement_utils_1.decimalToNumber)(snapshot.commissionAmount)
            : (0, settlement_utils_1.roundMoney)((grossAmount * commissionPercent) / 100);
        const netAmount = snapshot
            ? (0, settlement_utils_1.decimalToNumber)(snapshot.netMerchantEarnings)
            : (0, settlement_utils_1.roundMoney)(grossAmount - platformCommission);
        const now = new Date();
        const eligibleAt = (0, settlement_utils_1.addDays)(now, settlementDelay);
        await this.prisma.$transaction(async (tx) => {
            await tx.merchantWallet.upsert({
                where: { merchantProfileId },
                create: {
                    merchantProfileId,
                    pendingBalance: netAmount,
                    totalEarned: netAmount,
                },
                update: {
                    pendingBalance: { increment: netAmount },
                    totalEarned: { increment: netAmount },
                },
            });
            await tx.settlementLedger.create({
                data: {
                    merchantProfileId,
                    orderId,
                    grossAmount,
                    deliveryFee,
                    platformCommission,
                    taxAmount,
                    netAmount,
                    commissionPercent,
                    status: client_1.SettlementLedgerStatus.PENDING,
                    eligibleAt,
                },
            });
        });
        await this.audit.log({
            actorId: actorId ?? 'system',
            action: 'SETTLEMENT_CREATED',
            resourceType: 'settlement_ledger',
            resourceId: orderId,
            metadata: {
                orderNumber: order.orderNumber,
                merchantProfileId,
                netAmount,
                commissionPercent,
                eligibleAt: eligibleAt.toISOString(),
            },
        });
        this.logger.log({ orderId, merchantProfileId, netAmount }, 'Settlement ledger created');
        void this.financeCache.invalidateSettlements();
    }
    async processEligibleSettlements() {
        const now = new Date();
        const eligible = await this.prisma.settlementLedger.findMany({
            where: {
                status: client_1.SettlementLedgerStatus.PENDING,
                eligibleAt: { lte: now },
            },
            take: 200,
            select: { id: true, merchantProfileId: true, netAmount: true, orderId: true },
        });
        let processed = 0;
        for (const entry of eligible) {
            const net = (0, settlement_utils_1.decimalToNumber)(entry.netAmount);
            try {
                await this.prisma.$transaction(async (tx) => {
                    const updated = await tx.settlementLedger.updateMany({
                        where: { id: entry.id, status: client_1.SettlementLedgerStatus.PENDING },
                        data: {
                            status: client_1.SettlementLedgerStatus.SETTLED,
                            settledAt: now,
                        },
                    });
                    if (updated.count === 0)
                        return;
                    await tx.merchantWallet.update({
                        where: { merchantProfileId: entry.merchantProfileId },
                        data: {
                            pendingBalance: { decrement: net },
                            availableBalance: { increment: net },
                        },
                    });
                });
                processed += 1;
                await this.audit.log({
                    actorId: 'system',
                    action: 'SETTLEMENT_SETTLED',
                    resourceType: 'settlement_ledger',
                    resourceId: entry.id,
                    metadata: { orderId: entry.orderId, netAmount: net },
                });
            }
            catch (err) {
                this.logger.error({ err, ledgerId: entry.id }, 'Failed to settle ledger entry');
            }
        }
        return processed;
    }
    async requireMerchantProfile(userId) {
        const profile = await this.prisma.merchantProfile.findUnique({
            where: { userId },
            select: { id: true, businessName: true },
        });
        if (!profile)
            throw new common_1.NotFoundException('Merchant profile not found');
        return profile;
    }
    async getOrCreateWallet(merchantProfileId) {
        return this.prisma.merchantWallet.upsert({
            where: { merchantProfileId },
            create: { merchantProfileId },
            update: {},
        });
    }
    async getMerchantEarnings(userId) {
        const profile = await this.requireMerchantProfile(userId);
        const wallet = await this.getOrCreateWallet(profile.id);
        const [recentLedger, recentOrders, commissionSummary, openPayout] = await Promise.all([
            this.prisma.settlementLedger.findMany({
                where: { merchantProfileId: profile.id },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    orderId: true,
                    grossAmount: true,
                    platformCommission: true,
                    netAmount: true,
                    status: true,
                    createdAt: true,
                    order: { select: { orderNumber: true } },
                },
            }),
            this.prisma.settlementLedger.findMany({
                where: { merchantProfileId: profile.id },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    orderId: true,
                    grossAmount: true,
                    netAmount: true,
                    createdAt: true,
                    order: { select: { orderNumber: true, totalAmount: true } },
                },
            }),
            this.prisma.settlementLedger.aggregate({
                where: { merchantProfileId: profile.id },
                _sum: { platformCommission: true, grossAmount: true, netAmount: true },
            }),
            this.prisma.payoutRequest.findFirst({
                where: {
                    merchantProfileId: profile.id,
                    status: { in: [client_1.PayoutRequestStatus.PENDING, client_1.PayoutRequestStatus.APPROVED, client_1.PayoutRequestStatus.PROCESSING] },
                },
                orderBy: { requestedAt: 'desc' },
            }),
        ]);
        return {
            wallet: {
                availableBalance: (0, settlement_utils_1.decimalToNumber)(wallet.availableBalance),
                pendingBalance: (0, settlement_utils_1.decimalToNumber)(wallet.pendingBalance),
                totalEarned: (0, settlement_utils_1.decimalToNumber)(wallet.totalEarned),
                totalPaidOut: (0, settlement_utils_1.decimalToNumber)(wallet.totalPaidOut),
            },
            commissionBreakdown: {
                totalGross: (0, settlement_utils_1.decimalToNumber)(commissionSummary._sum.grossAmount),
                totalCommission: (0, settlement_utils_1.decimalToNumber)(commissionSummary._sum.platformCommission),
                totalNet: (0, settlement_utils_1.decimalToNumber)(commissionSummary._sum.netAmount),
            },
            recentOrdersRevenue: recentOrders.map((r) => ({
                orderId: r.orderId,
                orderNumber: r.order.orderNumber,
                orderTotal: (0, settlement_utils_1.decimalToNumber)(r.order.totalAmount),
                grossAmount: (0, settlement_utils_1.decimalToNumber)(r.grossAmount),
                netAmount: (0, settlement_utils_1.decimalToNumber)(r.netAmount),
                createdAt: r.createdAt.toISOString(),
            })),
            settlementHistory: recentLedger.map((l) => ({
                id: l.id,
                orderId: l.orderId,
                orderNumber: l.order.orderNumber,
                grossAmount: (0, settlement_utils_1.decimalToNumber)(l.grossAmount),
                platformCommission: (0, settlement_utils_1.decimalToNumber)(l.platformCommission),
                netAmount: (0, settlement_utils_1.decimalToNumber)(l.netAmount),
                status: l.status,
                createdAt: l.createdAt.toISOString(),
            })),
            openPayoutRequest: openPayout
                ? {
                    id: openPayout.id,
                    amount: (0, settlement_utils_1.decimalToNumber)(openPayout.amount),
                    status: openPayout.status,
                    requestedAt: openPayout.requestedAt.toISOString(),
                }
                : null,
        };
    }
    async listMerchantSettlements(userId, query) {
        const profile = await this.requireMerchantProfile(userId);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
            merchantProfileId: profile.id,
            ...(query.status ? { status: query.status } : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.settlementLedger.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { order: { select: { orderNumber: true } } },
            }),
            this.prisma.settlementLedger.count({ where }),
        ]);
        return {
            settlements: items.map((l) => ({
                id: l.id,
                orderId: l.orderId,
                orderNumber: l.order.orderNumber,
                grossAmount: (0, settlement_utils_1.decimalToNumber)(l.grossAmount),
                deliveryFee: (0, settlement_utils_1.decimalToNumber)(l.deliveryFee),
                platformCommission: (0, settlement_utils_1.decimalToNumber)(l.platformCommission),
                taxAmount: (0, settlement_utils_1.decimalToNumber)(l.taxAmount),
                netAmount: (0, settlement_utils_1.decimalToNumber)(l.netAmount),
                commissionPercent: (0, settlement_utils_1.decimalToNumber)(l.commissionPercent),
                status: l.status,
                eligibleAt: l.eligibleAt.toISOString(),
                settledAt: l.settledAt?.toISOString() ?? null,
                createdAt: l.createdAt.toISOString(),
            })),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async createPayoutRequest(userId, dto) {
        const profile = await this.requireMerchantProfile(userId);
        const amount = (0, settlement_utils_1.roundMoney)(dto.amount);
        if (amount <= 0)
            throw new common_1.BadRequestException('Payout amount must be positive');
        const bankDetailsSnapshot = {
            accountHolderName: dto.accountHolderName,
            accountNumber: dto.accountNumber,
            ifsc: dto.ifsc,
            bankName: dto.bankName ?? null,
        };
        const payout = await this.prisma.$transaction(async (tx) => {
            const open = await tx.payoutRequest.count({
                where: {
                    merchantProfileId: profile.id,
                    status: { in: [client_1.PayoutRequestStatus.PENDING, client_1.PayoutRequestStatus.APPROVED, client_1.PayoutRequestStatus.PROCESSING] },
                },
            });
            if (open > 0) {
                throw new common_1.ConflictException('An open payout request already exists');
            }
            const wallet = await tx.merchantWallet.findUnique({
                where: { merchantProfileId: profile.id },
            });
            const available = (0, settlement_utils_1.decimalToNumber)(wallet?.availableBalance);
            if (!wallet || amount > available) {
                throw new common_1.BadRequestException(`Insufficient available balance (₹${available})`);
            }
            return tx.payoutRequest.create({
                data: {
                    merchantProfileId: profile.id,
                    amount,
                    bankDetailsSnapshot,
                },
            });
        });
        await this.audit.log({
            actorId: userId,
            action: 'PAYOUT_REQUESTED',
            resourceType: 'payout_request',
            resourceId: payout.id,
            metadata: { amount, merchantProfileId: profile.id },
        });
        return {
            id: payout.id,
            amount: (0, settlement_utils_1.decimalToNumber)(payout.amount),
            status: payout.status,
            requestedAt: payout.requestedAt.toISOString(),
        };
    }
    async listMerchantPayouts(userId, query) {
        const profile = await this.requireMerchantProfile(userId);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.prisma.payoutRequest.findMany({
                where: { merchantProfileId: profile.id },
                orderBy: { requestedAt: 'desc' },
                skip,
                take: limit,
                include: { transactions: { orderBy: { createdAt: 'desc' }, take: 1 } },
            }),
            this.prisma.payoutRequest.count({ where: { merchantProfileId: profile.id } }),
        ]);
        return {
            payouts: items.map((p) => ({
                id: p.id,
                amount: (0, settlement_utils_1.decimalToNumber)(p.amount),
                status: p.status,
                rejectionReason: p.rejectionReason,
                requestedAt: p.requestedAt.toISOString(),
                reviewedAt: p.reviewedAt?.toISOString() ?? null,
                processedAt: p.processedAt?.toISOString() ?? null,
                transaction: p.transactions[0]
                    ? {
                        id: p.transactions[0].id,
                        status: p.transactions[0].status,
                        referenceId: p.transactions[0].referenceId,
                    }
                    : null,
            })),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getAdminSettlementsOverview() {
        const todayStart = (0, ist_day_util_1.startOfIstDay)();
        const [pendingPayouts, completedPayouts, liability, settledToday, wallets, recentLedger,] = await Promise.all([
            this.prisma.payoutRequest.count({
                where: { status: { in: [client_1.PayoutRequestStatus.PENDING, client_1.PayoutRequestStatus.APPROVED, client_1.PayoutRequestStatus.PROCESSING] } },
            }),
            this.prisma.payoutRequest.count({ where: { status: client_1.PayoutRequestStatus.COMPLETED } }),
            this.prisma.merchantWallet.aggregate({
                _sum: { availableBalance: true, pendingBalance: true },
            }),
            this.prisma.settlementLedger.aggregate({
                where: { settledAt: { gte: todayStart }, status: client_1.SettlementLedgerStatus.SETTLED },
                _sum: { netAmount: true },
                _count: { id: true },
            }),
            this.prisma.merchantWallet.findMany({
                orderBy: { availableBalance: 'desc' },
                take: 20,
                include: { merchantProfile: { select: { businessName: true } } },
            }),
            this.prisma.settlementLedger.findMany({
                orderBy: { createdAt: 'desc' },
                take: 25,
                include: {
                    order: { select: { orderNumber: true } },
                    merchantProfile: { select: { businessName: true } },
                },
            }),
        ]);
        return {
            summary: {
                pendingPayouts,
                completedPayouts,
                totalMerchantLiability: (0, settlement_utils_1.decimalToNumber)(liability._sum.availableBalance) +
                    (0, settlement_utils_1.decimalToNumber)(liability._sum.pendingBalance),
                availableLiability: (0, settlement_utils_1.decimalToNumber)(liability._sum.availableBalance),
                pendingLiability: (0, settlement_utils_1.decimalToNumber)(liability._sum.pendingBalance),
                totalSettledToday: (0, settlement_utils_1.decimalToNumber)(settledToday._sum.netAmount),
                settlementsSettledToday: settledToday._count.id,
            },
            merchantWallets: wallets.map((w) => ({
                merchantProfileId: w.merchantProfileId,
                businessName: w.merchantProfile.businessName,
                availableBalance: (0, settlement_utils_1.decimalToNumber)(w.availableBalance),
                pendingBalance: (0, settlement_utils_1.decimalToNumber)(w.pendingBalance),
                totalEarned: (0, settlement_utils_1.decimalToNumber)(w.totalEarned),
                totalPaidOut: (0, settlement_utils_1.decimalToNumber)(w.totalPaidOut),
            })),
            settlementLedger: recentLedger.map((l) => ({
                id: l.id,
                orderNumber: l.order.orderNumber,
                merchant: l.merchantProfile.businessName,
                netAmount: (0, settlement_utils_1.decimalToNumber)(l.netAmount),
                status: l.status,
                createdAt: l.createdAt.toISOString(),
            })),
        };
    }
    async listAdminPayoutRequests(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 25;
        const skip = (page - 1) * limit;
        const where = {
            ...(query.status ? { status: query.status } : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.payoutRequest.findMany({
                where,
                orderBy: { requestedAt: 'desc' },
                skip,
                take: limit,
                include: {
                    merchantProfile: { select: { businessName: true, gstNumber: true } },
                    transactions: { orderBy: { createdAt: 'desc' }, take: 1 },
                },
            }),
            this.prisma.payoutRequest.count({ where }),
        ]);
        return {
            payoutRequests: items.map((p) => ({
                id: p.id,
                merchant: p.merchantProfile.businessName,
                merchantProfileId: p.merchantProfileId,
                gstNumber: p.merchantProfile.gstNumber,
                amount: (0, settlement_utils_1.decimalToNumber)(p.amount),
                status: p.status,
                bankDetails: p.bankDetailsSnapshot,
                rejectionReason: p.rejectionReason,
                requestedAt: p.requestedAt.toISOString(),
                reviewedAt: p.reviewedAt?.toISOString() ?? null,
                processedAt: p.processedAt?.toISOString() ?? null,
                transaction: p.transactions[0] ?? null,
            })),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async approvePayoutRequest(adminUserId, payoutId) {
        const now = new Date();
        const payout = await this.prisma.$transaction(async (tx) => {
            const request = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
            if (!request)
                throw new common_1.NotFoundException('Payout request not found');
            if (request.status !== client_1.PayoutRequestStatus.PENDING) {
                throw new common_1.BadRequestException(`Cannot approve payout in status ${request.status}`);
            }
            const wallet = await tx.merchantWallet.findUnique({
                where: { merchantProfileId: request.merchantProfileId },
            });
            const amount = (0, settlement_utils_1.decimalToNumber)(request.amount);
            const available = (0, settlement_utils_1.decimalToNumber)(wallet?.availableBalance);
            if (!wallet || amount > available) {
                throw new common_1.BadRequestException('Merchant has insufficient available balance');
            }
            await tx.merchantWallet.update({
                where: { merchantProfileId: request.merchantProfileId },
                data: { availableBalance: { decrement: amount } },
            });
            return tx.payoutRequest.update({
                where: { id: payoutId },
                data: {
                    status: client_1.PayoutRequestStatus.APPROVED,
                    reviewedAt: now,
                    reviewedBy: adminUserId,
                },
            });
        });
        await this.audit.log({
            actorId: adminUserId,
            action: 'PAYOUT_APPROVED',
            resourceType: 'payout_request',
            resourceId: payoutId,
            metadata: { amount: (0, settlement_utils_1.decimalToNumber)(payout.amount) },
        });
        return { id: payout.id, status: payout.status };
    }
    async rejectPayoutRequest(adminUserId, payoutId, dto) {
        const now = new Date();
        const existing = await this.prisma.payoutRequest.findUnique({ where: { id: payoutId } });
        if (!existing)
            throw new common_1.NotFoundException('Payout request not found');
        if (existing.status !== client_1.PayoutRequestStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending payouts can be rejected');
        }
        const payout = await this.prisma.payoutRequest.update({
            where: { id: payoutId },
            data: {
                status: client_1.PayoutRequestStatus.REJECTED,
                rejectionReason: dto.reason,
                reviewedAt: now,
                reviewedBy: adminUserId,
            },
        });
        await this.audit.log({
            actorId: adminUserId,
            action: 'PAYOUT_REJECTED',
            resourceType: 'payout_request',
            resourceId: payoutId,
            metadata: { reason: dto.reason },
        });
        return { id: payout.id, status: payout.status };
    }
    async processPayoutRequest(adminUserId, payoutId) {
        const now = new Date();
        const result = await this.prisma.$transaction(async (tx) => {
            const request = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
            if (!request)
                throw new common_1.NotFoundException('Payout request not found');
            if (request.status !== client_1.PayoutRequestStatus.APPROVED) {
                throw new common_1.BadRequestException('Payout must be approved before processing');
            }
            await tx.payoutRequest.update({
                where: { id: payoutId },
                data: { status: client_1.PayoutRequestStatus.PROCESSING, processedBy: adminUserId },
            });
            const referenceId = `PAY-${Date.now()}-${payoutId.slice(-6)}`;
            const txn = await tx.payoutTransaction.create({
                data: {
                    payoutRequestId: payoutId,
                    amount: request.amount,
                    status: client_1.PayoutTransactionStatus.SUCCESS,
                    referenceId,
                    processedAt: now,
                },
            });
            await tx.payoutRequest.update({
                where: { id: payoutId },
                data: {
                    status: client_1.PayoutRequestStatus.COMPLETED,
                    processedAt: now,
                    processedBy: adminUserId,
                },
            });
            await tx.merchantWallet.update({
                where: { merchantProfileId: request.merchantProfileId },
                data: { totalPaidOut: { increment: request.amount } },
            });
            const merchantPayout = await tx.merchantPayout.create({
                data: {
                    merchantProfileId: request.merchantProfileId,
                    payoutRequestId: payoutId,
                    amount: request.amount,
                    status: 'COMPLETED',
                    referenceId,
                    bankSnapshot: request.bankDetailsSnapshot,
                    processedAt: now,
                    processedBy: adminUserId,
                },
            });
            const settledEntries = await tx.settlementLedger.findMany({
                where: {
                    merchantProfileId: request.merchantProfileId,
                    status: client_1.SettlementLedgerStatus.SETTLED,
                    payoutRequestId: null,
                },
                orderBy: { settledAt: 'asc' },
            });
            let remaining = (0, settlement_utils_1.decimalToNumber)(request.amount);
            for (const entry of settledEntries) {
                if (remaining <= 0)
                    break;
                const net = (0, settlement_utils_1.decimalToNumber)(entry.netAmount);
                if (net <= remaining) {
                    await tx.settlementLedger.update({
                        where: { id: entry.id },
                        data: { status: client_1.SettlementLedgerStatus.PAID_OUT, payoutRequestId: payoutId },
                    });
                    remaining = (0, settlement_utils_1.roundMoney)(remaining - net);
                }
            }
            return { request, txn, referenceId, merchantPayout };
        });
        await this.ledger.recordMerchantPayout(result.merchantPayout.id, result.request.merchantProfileId, (0, settlement_utils_1.decimalToNumber)(result.request.amount));
        void this.financeCache.invalidatePayouts();
        await this.audit.log({
            actorId: adminUserId,
            action: 'PAYOUT_PROCESSED',
            resourceType: 'payout_request',
            resourceId: payoutId,
            metadata: {
                referenceId: result.referenceId,
                amount: (0, settlement_utils_1.decimalToNumber)(result.request.amount),
            },
        });
        return {
            id: payoutId,
            status: client_1.PayoutRequestStatus.COMPLETED,
            referenceId: result.referenceId,
            transactionId: result.txn.id,
        };
    }
    async assertMerchantOwnsPayout(userId, payoutId) {
        const profile = await this.requireMerchantProfile(userId);
        const payout = await this.prisma.payoutRequest.findUnique({
            where: { id: payoutId },
            select: { merchantProfileId: true },
        });
        if (!payout || payout.merchantProfileId !== profile.id) {
            throw new common_1.ForbiddenException('Payout not found');
        }
    }
};
exports.SettlementService = SettlementService;
exports.SettlementService = SettlementService = SettlementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settlement_commission_service_1.SettlementCommissionService,
        finance_commission_service_1.FinanceCommissionService,
        ledger_service_1.LedgerService,
        finance_cache_service_1.FinanceCacheService,
        audit_service_1.AuditService])
], SettlementService);
//# sourceMappingURL=settlement.service.js.map