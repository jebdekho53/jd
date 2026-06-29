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
var ClaimReplacementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimReplacementService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const delivery_orchestrator_service_1 = require("../logistics/delivery-orchestrator.service");
const claim_eligibility_service_1 = require("./claim-eligibility.service");
const secure_random_util_1 = require("../../common/utils/secure-random.util");
const order_claim_constants_1 = require("./order-claim.constants");
function generateOrderNumber() {
    return `JD${(0, secure_random_util_1.secureNumericCode)(10)}`;
}
let ClaimReplacementService = ClaimReplacementService_1 = class ClaimReplacementService {
    constructor(prisma, delivery, eligibility) {
        this.prisma = prisma;
        this.delivery = delivery;
        this.eligibility = eligibility;
        this.logger = new common_1.Logger(ClaimReplacementService_1.name);
    }
    async issueReplacement(claimId, actorId, actorType, dispatchShipment = true) {
        const claim = await this.prisma.orderClaim.findUnique({
            where: { id: claimId },
            include: {
                items: { include: { orderItem: true } },
                order: true,
                replacement: true,
            },
        });
        if (!claim)
            throw new common_1.BadRequestException('Claim not found');
        if (claim.replacement?.status === 'SHIPPED' && claim.replacement.shipmentId) {
            return {
                replacementOrderId: claim.replacement.replacementOrderId,
                shipmentId: claim.replacement.shipmentId,
            };
        }
        if (claim.replacement &&
            (claim.replacement.status === order_claim_constants_1.REPLACEMENT_DISPATCH_FAILED ||
                claim.replacement.status === 'PENDING')) {
            const shipmentId = dispatchShipment
                ? await this.dispatchReplacementShipment(claimId, claim.replacement.replacementOrderId, actorId, actorType)
                : undefined;
            return {
                replacementOrderId: claim.replacement.replacementOrderId,
                shipmentId,
            };
        }
        if (claim.replacement) {
            return {
                replacementOrderId: claim.replacement.replacementOrderId,
                shipmentId: claim.replacement.shipmentId ?? undefined,
            };
        }
        const original = claim.order;
        let replacementOrderId = '';
        await this.prisma.$transaction(async (tx) => {
            const orderNumber = generateOrderNumber();
            const subtotal = claim.items.reduce((sum, i) => sum + Number(i.unitPrice) * (i.quantityApproved ?? i.quantityClaimed), 0);
            const replacementOrder = await tx.order.create({
                data: {
                    orderNumber,
                    buyerProfileId: original.buyerProfileId,
                    storeId: original.storeId,
                    status: client_1.OrderStatus.MERCHANT_ACCEPTED,
                    paymentMethod: client_1.PaymentMethod.COD,
                    paymentStatus: client_1.PaymentStatus.PAID,
                    subtotal,
                    discountAmount: 0,
                    deliveryFee: 0,
                    taxAmount: 0,
                    totalAmount: 0,
                    walletAmountUsed: 0,
                    deliveryAddress: original.deliveryAddress,
                    deliveryLat: original.deliveryLat,
                    deliveryLng: original.deliveryLng,
                    orderVertical: original.orderVertical,
                    buyerNote: `REPLACEMENT_FOR_CLAIM:${claim.claimNumber}`,
                    paidAt: new Date(),
                },
            });
            for (const item of claim.items) {
                const qty = item.quantityApproved ?? item.quantityClaimed;
                const oi = item.orderItem;
                await tx.orderItem.create({
                    data: {
                        orderId: replacementOrder.id,
                        productId: oi.productId,
                        variantId: oi.variantId,
                        productName: oi.productName,
                        variantName: oi.variantName,
                        sku: oi.sku,
                        quantity: qty,
                        unitPrice: item.unitPrice,
                        discount: 0,
                        tax: 0,
                        totalPrice: Number(item.unitPrice) * qty,
                    },
                });
            }
            replacementOrderId = replacementOrder.id;
            await tx.claimReplacement.create({
                data: {
                    claimId,
                    replacementOrderId,
                    status: 'PENDING',
                },
            });
            await tx.orderClaim.update({
                where: { id: claimId },
                data: {
                    status: client_1.OrderClaimStatus.REPLACEMENT_APPROVED,
                    replacementOrderId,
                },
            });
            await this.eligibility.appendHistory(tx, claimId, client_1.OrderClaimStatus.REPLACEMENT_APPROVED, actorType, actorId, 'Replacement order created', { replacementOrderId });
        });
        let shipmentId;
        if (dispatchShipment) {
            shipmentId = await this.dispatchReplacementShipment(claimId, replacementOrderId, actorId, actorType);
        }
        return { replacementOrderId, shipmentId };
    }
    async dispatchReplacementShipment(claimId, replacementOrderId, actorId, actorType) {
        try {
            const dispatch = await this.delivery.dispatchShipment(replacementOrderId);
            await this.prisma.$transaction(async (tx) => {
                await tx.claimReplacement.update({
                    where: { claimId },
                    data: {
                        shipmentId: dispatch.shipmentId,
                        status: 'SHIPPED',
                        shippedAt: new Date(),
                    },
                });
                await tx.orderClaim.update({
                    where: { id: claimId },
                    data: { status: client_1.OrderClaimStatus.REPLACEMENT_SHIPPED },
                });
                await this.eligibility.appendHistory(tx, claimId, client_1.OrderClaimStatus.REPLACEMENT_SHIPPED, client_1.ClaimActorType.SYSTEM, null, 'Replacement shipment dispatched', { shipmentId: dispatch.shipmentId });
            });
            return dispatch.shipmentId;
        }
        catch (err) {
            this.logger.error({ err, claimId, replacementOrderId }, 'Replacement dispatch failed');
            await this.prisma.$transaction(async (tx) => {
                await tx.claimReplacement.update({
                    where: { claimId },
                    data: { status: order_claim_constants_1.REPLACEMENT_DISPATCH_FAILED },
                });
                await this.eligibility.appendHistory(tx, claimId, client_1.OrderClaimStatus.REPLACEMENT_APPROVED, actorType, actorId, 'Replacement dispatch failed — retry required', { replacementOrderId, error: String(err) });
            });
            throw new common_1.BadRequestException('Replacement order created but dispatch failed; retry with ISSUE_REPLACEMENT');
        }
    }
};
exports.ClaimReplacementService = ClaimReplacementService;
exports.ClaimReplacementService = ClaimReplacementService = ClaimReplacementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        delivery_orchestrator_service_1.DeliveryOrchestratorService,
        claim_eligibility_service_1.ClaimEligibilityService])
], ClaimReplacementService);
//# sourceMappingURL=claim-replacement.service.js.map