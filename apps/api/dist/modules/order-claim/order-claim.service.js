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
var OrderClaimService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderClaimService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../database/prisma.service");
const merchant_service_1 = require("../merchant/merchant.service");
const product_return_policy_util_1 = require("../../common/utils/product-return-policy.util");
const secure_random_util_1 = require("../../common/utils/secure-random.util");
const claim_eligibility_service_1 = require("./claim-eligibility.service");
const claim_refund_service_1 = require("./claim-refund.service");
const claim_replacement_service_1 = require("./claim-replacement.service");
const claim_notification_service_1 = require("./claim-notification.service");
const configuration_1 = require("../../config/configuration");
const claim_evidence_util_1 = require("./claim-evidence.util");
const order_claim_constants_1 = require("./order-claim.constants");
const CLAIM_INCLUDE = {
    items: { include: { product: true, orderItem: true } },
    evidence: true,
    history: { orderBy: { createdAt: 'asc' } },
    refund: true,
    replacement: true,
    order: { select: { orderNumber: true, status: true } },
};
let OrderClaimService = OrderClaimService_1 = class OrderClaimService {
    constructor(prisma, merchantService, eligibility, claimRefund, claimReplacement, notifications, config) {
        this.prisma = prisma;
        this.merchantService = merchantService;
        this.eligibility = eligibility;
        this.claimRefund = claimRefund;
        this.claimReplacement = claimReplacement;
        this.notifications = notifications;
        this.config = config;
        this.logger = new common_1.Logger(OrderClaimService_1.name);
    }
    generateClaimNumber() {
        return `CLM-${(0, secure_random_util_1.secureNumericCode)(8)}`;
    }
    getUploadPublicBase() {
        return (0, configuration_1.getConfig)(this.config).storage.uploadPublicUrl;
    }
    async resolveMerchantStoreIds(merchantProfileId, storeId) {
        if (storeId) {
            const store = await this.prisma.store.findFirst({
                where: { id: storeId, merchantProfileId, deletedAt: null },
                select: { id: true },
            });
            if (!store)
                throw new common_1.NotFoundException('Store not found');
            return [store.id];
        }
        const stores = await this.prisma.store.findMany({
            where: { merchantProfileId, deletedAt: null },
            select: { id: true },
        });
        return stores.map((s) => s.id);
    }
    async createBuyerClaim(buyerUserId, orderId, dto) {
        if (dto.idempotencyKey) {
            const existing = await this.prisma.orderClaim.findFirst({
                where: {
                    idempotencyKey: dto.idempotencyKey,
                    buyerProfile: { userId: buyerUserId },
                },
                include: CLAIM_INCLUDE,
            });
            if (existing) {
                if (existing.orderId !== orderId) {
                    throw new common_1.ConflictException('Idempotency key already used for a different order');
                }
                return this.serializeClaim(existing);
            }
        }
        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                buyerProfile: { userId: buyerUserId },
                status: { in: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED] },
            },
            include: {
                delivery: { select: { deliveredAt: true } },
                buyerProfile: { select: { id: true, userId: true } },
                items: { include: { product: true } },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found or not eligible for claims');
        if (dto.evidence?.length) {
            (0, claim_evidence_util_1.assertClaimEvidenceUrls)(dto.evidence, this.getUploadPublicBase());
        }
        const itemMap = new Map(order.items.map((i) => [i.id, i]));
        const claimedMap = await this.eligibility.getActiveClaimedQuantities(dto.items.map((l) => l.orderItemId));
        let requestedAmount = 0;
        let autoApprove = true;
        const policies = [];
        for (const line of dto.items) {
            const orderItem = itemMap.get(line.orderItemId);
            if (!orderItem)
                throw new common_1.BadRequestException(`Invalid order item ${line.orderItemId}`);
            const alreadyClaimed = claimedMap.get(line.orderItemId) ?? 0;
            const remaining = orderItem.quantity - alreadyClaimed;
            if (remaining <= 0) {
                throw new common_1.BadRequestException(`No claimable quantity remaining for ${orderItem.productName}`);
            }
            if (line.quantity > remaining) {
                throw new common_1.BadRequestException(`Quantity exceeds remaining claimable amount for ${orderItem.productName}`);
            }
            const policy = this.eligibility.productToPolicy(orderItem.product);
            policies.push(policy);
            const lineAmount = Number(orderItem.unitPrice) * line.quantity;
            requestedAmount += lineAmount;
            const check = (0, product_return_policy_util_1.evaluateClaimEligibility)({
                policy,
                claimType: dto.claimType,
                reason: dto.reason,
                deliveredAt: order.delivery?.deliveredAt ?? null,
                completedAt: order.completedAt,
                requestedAmount: lineAmount,
            });
            if (!check.eligible) {
                throw new common_1.BadRequestException(check.reason ?? 'Item not eligible for claim');
            }
            if (!check.autoApprove)
                autoApprove = false;
            const evidenceErr = this.eligibility.validateEvidence(policy, dto.evidence ?? []);
            if (evidenceErr)
                throw new common_1.BadRequestException(evidenceErr);
        }
        const restockingFee = policies.reduce((max, p) => Math.max(max, p.restockingFee), 0);
        const netAmount = Math.max(0, requestedAmount - restockingFee);
        const initialStatus = autoApprove ? client_1.OrderClaimStatus.APPROVED : client_1.OrderClaimStatus.PENDING;
        const claim = await this.prisma.$transaction(async (tx) => {
            const created = await tx.orderClaim.create({
                data: {
                    claimNumber: this.generateClaimNumber(),
                    orderId,
                    buyerProfileId: order.buyerProfile.id,
                    storeId: order.storeId,
                    claimType: dto.claimType,
                    status: initialStatus,
                    reason: dto.reason,
                    reasonNote: dto.reasonNote,
                    requestedAmount: netAmount,
                    approvedAmount: autoApprove ? netAmount : null,
                    restockingFee,
                    idempotencyKey: dto.idempotencyKey,
                    items: {
                        create: dto.items.map((line) => {
                            const oi = itemMap.get(line.orderItemId);
                            return {
                                orderItemId: line.orderItemId,
                                productId: oi.productId,
                                quantityClaimed: line.quantity,
                                quantityApproved: autoApprove ? line.quantity : null,
                                unitPrice: oi.unitPrice,
                                refundAmount: autoApprove
                                    ? Number(oi.unitPrice) * line.quantity
                                    : 0,
                            };
                        }),
                    },
                    evidence: dto.evidence?.length
                        ? {
                            create: dto.evidence.map((e) => ({ kind: e.kind, url: e.url })),
                        }
                        : undefined,
                },
                include: CLAIM_INCLUDE,
            });
            await this.eligibility.appendHistory(tx, created.id, client_1.OrderClaimStatus.PENDING, client_1.ClaimActorType.BUYER, buyerUserId, 'Claim submitted');
            if (autoApprove) {
                await this.eligibility.appendHistory(tx, created.id, client_1.OrderClaimStatus.APPROVED, client_1.ClaimActorType.SYSTEM, null, 'Auto-approved per product policy');
            }
            return created;
        });
        this.notifications.notifyClaimSubmitted({
            claimId: claim.id,
            claimNumber: claim.claimNumber,
            buyerUserId: order.buyerProfile.userId,
            storeId: order.storeId,
        });
        if (autoApprove) {
            await this.fulfillApprovedClaim(claim.id, buyerUserId, client_1.ClaimActorType.SYSTEM);
            const refreshed = await this.prisma.orderClaim.findUnique({
                where: { id: claim.id },
                include: CLAIM_INCLUDE,
            });
            return this.serializeClaim(refreshed);
        }
        return this.serializeClaim(claim);
    }
    async listBuyerClaims(buyerUserId, orderId) {
        const claims = await this.prisma.orderClaim.findMany({
            where: {
                orderId,
                buyerProfile: { userId: buyerUserId },
            },
            include: CLAIM_INCLUDE,
            orderBy: { createdAt: 'desc' },
        });
        return claims.map((c) => this.serializeClaim(c));
    }
    async getOrderEligibility(buyerUserId, orderId) {
        return this.eligibility.getOrderEligibility(orderId, buyerUserId);
    }
    async listMerchantClaims(userId, dto) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const storeIds = await this.resolveMerchantStoreIds(profile.id, dto.storeId);
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const where = {
            storeId: { in: storeIds },
            ...(dto.status ? { status: dto.status } : {}),
            ...(dto.claimType ? { claimType: dto.claimType } : {}),
        };
        const [total, claims] = await Promise.all([
            this.prisma.orderClaim.count({ where }),
            this.prisma.orderClaim.findMany({
                where,
                include: CLAIM_INCLUDE,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return {
            items: claims.map((c) => this.serializeClaim(c)),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async patchMerchantClaim(userId, claimId, dto) {
        const claim = await this.getClaimForMerchant(userId, claimId);
        return this.applyClaimAction(claim.id, userId, client_1.ClaimActorType.MERCHANT, dto);
    }
    async listAdminClaims(dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const where = {
            ...(dto.status ? { status: dto.status } : {}),
            ...(dto.claimType ? { claimType: dto.claimType } : {}),
            ...(dto.storeId ? { storeId: dto.storeId } : {}),
        };
        const [total, claims] = await Promise.all([
            this.prisma.orderClaim.count({ where }),
            this.prisma.orderClaim.findMany({
                where,
                include: {
                    ...CLAIM_INCLUDE,
                    store: { select: { id: true, name: true } },
                    buyerProfile: { select: { id: true, name: true, userId: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return {
            items: claims.map((c) => this.serializeClaim(c)),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async patchAdminClaim(userId, claimId, dto) {
        const claim = await this.prisma.orderClaim.findUnique({ where: { id: claimId } });
        if (!claim)
            throw new common_1.NotFoundException('Claim not found');
        if (dto.adminAction === 'SUSPEND_MERCHANT') {
            const store = await this.prisma.store.findUnique({
                where: { id: claim.storeId },
                select: { merchantProfileId: true },
            });
            if (store) {
                await this.prisma.merchantProfile.update({
                    where: { id: store.merchantProfileId },
                    data: {
                        isBlacklisted: true,
                        blacklistReason: dto.note ?? 'Suspended due to claim escalation',
                        blacklistedAt: new Date(),
                        blacklistedBy: userId,
                    },
                });
            }
        }
        if (dto.adminAction === 'FORCE_REFUND') {
            dto.action = 'APPROVE_REFUND';
        }
        return this.applyClaimAction(claimId, userId, client_1.ClaimActorType.ADMIN, dto, dto.note);
    }
    async getClaimAnalyticsForMerchant(userId, storeId) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const storeIds = await this.resolveMerchantStoreIds(profile.id, storeId);
        const [totalOrders, claims, refunds, replacements] = await Promise.all([
            this.prisma.order.count({
                where: {
                    storeId: { in: storeIds },
                    status: { in: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED] },
                },
            }),
            this.prisma.orderClaim.groupBy({
                by: ['status', 'claimType'],
                where: { storeId: { in: storeIds } },
                _count: true,
            }),
            this.prisma.claimRefund.aggregate({
                where: { claim: { storeId: { in: storeIds } }, status: 'REFUNDED' },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.claimReplacement.count({
                where: { claim: { storeId: { in: storeIds } } },
            }),
        ]);
        const claimCount = claims.reduce((s, c) => s + c._count, 0);
        const refundCount = claims
            .filter((c) => c.claimType === client_1.OrderClaimType.REFUND)
            .reduce((s, c) => s + c._count, 0);
        const replacementCount = claims
            .filter((c) => c.claimType === client_1.OrderClaimType.REPLACEMENT)
            .reduce((s, c) => s + c._count, 0);
        const topProducts = await this.prisma.orderClaimItem.groupBy({
            by: ['productId'],
            where: { claim: { storeId: { in: storeIds } } },
            _count: true,
            orderBy: { _count: { productId: 'desc' } },
            take: 5,
        });
        const productNames = await this.prisma.product.findMany({
            where: { id: { in: topProducts.map((p) => p.productId) } },
            select: { id: true, name: true },
        });
        const nameMap = new Map(productNames.map((p) => [p.id, p.name]));
        return {
            refundRatePct: totalOrders > 0 ? round((refundCount / totalOrders) * 100) : 0,
            replacementRatePct: totalOrders > 0 ? round((replacementCount / totalOrders) * 100) : 0,
            totalClaims: claimCount,
            refundCost: Number(refunds._sum.amount ?? 0),
            replacementCount: replacements,
            topReturnedProducts: topProducts.map((p) => ({
                productId: p.productId,
                productName: nameMap.get(p.productId) ?? 'Unknown',
                claimCount: p._count,
            })),
            statusBreakdown: claims,
        };
    }
    async getClaimForMerchant(userId, claimId) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const claim = await this.prisma.orderClaim.findFirst({
            where: {
                id: claimId,
                store: { merchantProfileId: profile.id, deletedAt: null },
            },
        });
        if (!claim)
            throw new common_1.NotFoundException('Claim not found');
        return claim;
    }
    assertFulfillmentActionAllowed(claim, action) {
        if (!order_claim_constants_1.FULFILLMENT_CLAIM_ACTIONS.has(action))
            return;
        const isDispatchRetry = action === 'ISSUE_REPLACEMENT' &&
            claim.replacement?.status === order_claim_constants_1.REPLACEMENT_DISPATCH_FAILED;
        if (isDispatchRetry)
            return;
        if (order_claim_constants_1.TERMINAL_FULFILLMENT_CLAIM_STATUSES.includes(claim.status)) {
            throw new common_1.BadRequestException(`Claim is already ${claim.status}`);
        }
        if ((action === 'APPROVE_REFUND' || action === 'APPROVE') &&
            claim.refund?.status === client_1.PaymentStatus.REFUNDED) {
            throw new common_1.BadRequestException('Refund has already been processed for this claim');
        }
    }
    async applyClaimAction(claimId, actorId, actorType, dto, adminNote) {
        const claim = await this.prisma.orderClaim.findUnique({
            where: { id: claimId },
            include: {
                order: { include: { buyerProfile: { select: { userId: true } } } },
                refund: true,
                replacement: true,
            },
        });
        if (!claim)
            throw new common_1.NotFoundException('Claim not found');
        this.assertFulfillmentActionAllowed(claim, dto.action);
        const noteField = actorType === client_1.ClaimActorType.ADMIN
            ? { adminNote: adminNote ?? dto.note }
            : { merchantNote: dto.note };
        switch (dto.action) {
            case 'REQUEST_EVIDENCE':
                await this.prisma.$transaction(async (tx) => {
                    await tx.orderClaim.update({
                        where: { id: claimId },
                        data: { status: client_1.OrderClaimStatus.EVIDENCE_REQUESTED, ...noteField },
                    });
                    await this.eligibility.appendHistory(tx, claimId, client_1.OrderClaimStatus.EVIDENCE_REQUESTED, actorType, actorId, dto.note);
                });
                break;
            case 'REJECT':
                await this.prisma.$transaction(async (tx) => {
                    await tx.orderClaim.update({
                        where: { id: claimId },
                        data: {
                            status: client_1.OrderClaimStatus.REJECTED,
                            resolvedAt: new Date(),
                            ...noteField,
                        },
                    });
                    await this.eligibility.appendHistory(tx, claimId, client_1.OrderClaimStatus.REJECTED, actorType, actorId, dto.note);
                });
                break;
            case 'APPROVE':
            case 'APPROVE_REFUND':
            case 'APPROVE_REPLACEMENT': {
                const approvedAmount = dto.approvedAmount ?? Number(claim.requestedAmount);
                await this.prisma.$transaction(async (tx) => {
                    await tx.orderClaim.update({
                        where: { id: claimId },
                        data: {
                            status: client_1.OrderClaimStatus.APPROVED,
                            approvedAmount,
                            returnPickupEnabled: dto.returnPickupEnabled ?? claim.returnPickupEnabled,
                            ...noteField,
                        },
                    });
                    const items = await tx.orderClaimItem.findMany({ where: { claimId } });
                    for (const item of items) {
                        await tx.orderClaimItem.update({
                            where: { id: item.id },
                            data: {
                                quantityApproved: item.quantityClaimed,
                                refundAmount: Number(item.unitPrice) * item.quantityClaimed,
                            },
                        });
                    }
                    await this.eligibility.appendHistory(tx, claimId, client_1.OrderClaimStatus.APPROVED, actorType, actorId, dto.note, { approvedAmount });
                });
                await this.fulfillApprovedClaim(claimId, actorId, actorType, dto.action);
                break;
            }
            case 'ISSUE_REPLACEMENT':
                await this.claimReplacement.issueReplacement(claimId, actorId, actorType, true);
                break;
            default:
                throw new common_1.BadRequestException('Unknown action');
        }
        const updated = await this.prisma.orderClaim.findUnique({
            where: { id: claimId },
            include: CLAIM_INCLUDE,
        });
        this.notifications.notifyClaimStatus({
            claimId,
            claimNumber: claim.claimNumber,
            buyerUserId: claim.order.buyerProfile.userId,
            storeId: claim.storeId,
            status: updated.status,
        });
        return this.serializeClaim(updated);
    }
    async fulfillApprovedClaim(claimId, actorId, actorType, action) {
        const claim = await this.prisma.orderClaim.findUnique({
            where: { id: claimId },
            include: { refund: true },
        });
        if (!claim || claim.status !== client_1.OrderClaimStatus.APPROVED)
            return;
        if (claim.claimType === client_1.OrderClaimType.REFUND ||
            claim.claimType === client_1.OrderClaimType.RETURN ||
            action === 'APPROVE_REFUND') {
            if (claim.refund?.status === client_1.PaymentStatus.REFUNDED)
                return;
            await this.prisma.orderClaim.update({
                where: { id: claimId },
                data: { status: client_1.OrderClaimStatus.REFUND_PROCESSING },
            });
            await this.claimRefund.processRefund(claimId, actorId, actorType);
            return;
        }
        if (claim.claimType === client_1.OrderClaimType.REPLACEMENT ||
            action === 'APPROVE_REPLACEMENT' ||
            action === 'ISSUE_REPLACEMENT') {
            await this.claimReplacement.issueReplacement(claimId, actorId, actorType, true);
        }
    }
    serializeClaim(claim) {
        return {
            id: claim.id,
            claimNumber: claim.claimNumber,
            orderId: claim.orderId,
            orderNumber: claim.order?.orderNumber,
            storeId: claim.storeId,
            claimType: claim.claimType,
            status: claim.status,
            reason: claim.reason,
            reasonNote: claim.reasonNote,
            requestedAmount: Number(claim.requestedAmount),
            approvedAmount: claim.approvedAmount ? Number(claim.approvedAmount) : null,
            restockingFee: Number(claim.restockingFee),
            merchantNote: claim.merchantNote,
            adminNote: claim.adminNote,
            replacementOrderId: claim.replacementOrderId,
            returnPickupEnabled: claim.returnPickupEnabled,
            resolvedAt: claim.resolvedAt,
            createdAt: claim.createdAt,
            updatedAt: claim.updatedAt,
            items: claim.items.map((i) => ({
                id: i.id,
                orderItemId: i.orderItemId,
                productId: i.productId,
                productName: i.orderItem?.productName,
                quantityClaimed: i.quantityClaimed,
                quantityApproved: i.quantityApproved,
                unitPrice: Number(i.unitPrice),
                refundAmount: Number(i.refundAmount),
            })),
            evidence: claim.evidence,
            history: claim.history,
            refund: claim.refund
                ? {
                    ...claim.refund,
                    amount: Number(claim.refund.amount),
                    walletAmount: Number(claim.refund.walletAmount),
                    razorpayAmount: Number(claim.refund.razorpayAmount),
                }
                : null,
            replacement: claim.replacement,
        };
    }
};
exports.OrderClaimService = OrderClaimService;
exports.OrderClaimService = OrderClaimService = OrderClaimService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        merchant_service_1.MerchantService,
        claim_eligibility_service_1.ClaimEligibilityService,
        claim_refund_service_1.ClaimRefundService,
        claim_replacement_service_1.ClaimReplacementService,
        claim_notification_service_1.ClaimNotificationService, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], OrderClaimService);
function round(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=order-claim.service.js.map