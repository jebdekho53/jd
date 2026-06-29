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
exports.ClaimEligibilityService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const product_return_policy_util_1 = require("../../common/utils/product-return-policy.util");
const order_claim_constants_1 = require("./order-claim.constants");
let ClaimEligibilityService = class ClaimEligibilityService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getActiveClaimedQuantities(orderItemIds) {
        if (!orderItemIds.length)
            return new Map();
        const rows = await this.prisma.orderClaimItem.groupBy({
            by: ['orderItemId'],
            where: {
                orderItemId: { in: orderItemIds },
                claim: { status: { notIn: order_claim_constants_1.INACTIVE_CLAIM_STATUSES } },
            },
            _sum: { quantityClaimed: true },
        });
        return new Map(rows.map((r) => [r.orderItemId, r._sum.quantityClaimed ?? 0]));
    }
    productToPolicy(product) {
        return {
            isReturnable: product.isReturnable,
            isRefundable: product.isRefundable,
            isReplaceable: product.isReplaceable,
            returnWindowHours: product.returnWindowHours,
            approvalMode: product.approvalMode,
            proofRequired: product.proofRequired,
            autoApproveBelowAmount: product.autoApproveBelowAmount
                ? Number(product.autoApproveBelowAmount)
                : null,
            returnReasons: product.returnReasons,
            restockingFee: Number(product.restockingFee),
            refundMethod: product.refundMethod,
            returnPolicyText: product.returnPolicyText,
            replacementPolicyText: product.replacementPolicyText,
            preparedFoodPolicy: product.preparedFoodPolicy,
            allowCustomerChangedMind: product.allowCustomerChangedMind,
        };
    }
    async getOrderEligibility(orderId, buyerUserId) {
        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                buyerProfile: { userId: buyerUserId },
                status: { in: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED] },
            },
            include: {
                delivery: { select: { deliveredAt: true } },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                isReturnable: true,
                                isRefundable: true,
                                isReplaceable: true,
                                returnWindowHours: true,
                                approvalMode: true,
                                proofRequired: true,
                                autoApproveBelowAmount: true,
                                returnReasons: true,
                                restockingFee: true,
                                refundMethod: true,
                                returnPolicyText: true,
                                replacementPolicyText: true,
                                preparedFoodPolicy: true,
                                allowCustomerChangedMind: true,
                            },
                        },
                    },
                },
            },
        });
        if (!order) {
            return {
                orderId,
                deliveredAt: null,
                actions: { return: false, refund: false, replacement: false },
                items: [],
            };
        }
        const deliveredAt = order.delivery?.deliveredAt ?? order.completedAt;
        const claimedMap = await this.getActiveClaimedQuantities(order.items.map((i) => i.id));
        const items = order.items.map((item) => {
            const policy = this.productToPolicy(item.product);
            const summary = (0, product_return_policy_util_1.buildReturnPolicySummary)(policy);
            const alreadyClaimed = claimedMap.get(item.id) ?? 0;
            const remaining = Math.max(0, item.quantity - alreadyClaimed);
            const claimTypes = [];
            if (remaining > 0) {
                for (const type of [
                    client_1.OrderClaimType.RETURN,
                    client_1.OrderClaimType.REFUND,
                    client_1.OrderClaimType.REPLACEMENT,
                ]) {
                    const check = (0, product_return_policy_util_1.evaluateClaimEligibility)({
                        policy,
                        claimType: type,
                        reason: client_1.ReturnClaimReason.OTHER,
                        deliveredAt,
                        completedAt: order.completedAt,
                        requestedAmount: Number(item.unitPrice) * remaining,
                    });
                    if (check.eligible)
                        claimTypes.push(type);
                }
            }
            return {
                orderItemId: item.id,
                productId: item.productId,
                productName: item.productName,
                maxQuantity: remaining,
                policy: summary,
                claimTypes,
                reasons: policy.returnReasons.length > 0
                    ? policy.returnReasons
                    : Object.values(client_1.ReturnClaimReason),
            };
        });
        return {
            orderId,
            deliveredAt,
            actions: {
                return: items.some((i) => i.claimTypes.includes(client_1.OrderClaimType.RETURN)),
                refund: items.some((i) => i.claimTypes.includes(client_1.OrderClaimType.REFUND)),
                replacement: items.some((i) => i.claimTypes.includes(client_1.OrderClaimType.REPLACEMENT)),
            },
            items,
        };
    }
    validateEvidence(policy, evidence) {
        const photoCount = evidence.filter((e) => e.kind === 'PHOTO').length;
        const videoCount = evidence.filter((e) => e.kind === 'VIDEO').length;
        return (0, product_return_policy_util_1.validateEvidenceForPolicy)(policy, photoCount, videoCount);
    }
    async appendHistory(tx, claimId, status, actorType, actorId, note, metadata) {
        await tx.claimHistory.create({
            data: {
                claimId,
                status,
                actorType,
                actorId,
                note,
                metadata: metadata,
            },
        });
    }
};
exports.ClaimEligibilityService = ClaimEligibilityService;
exports.ClaimEligibilityService = ClaimEligibilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClaimEligibilityService);
//# sourceMappingURL=claim-eligibility.service.js.map