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
var ClaimRefundService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimRefundService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const razorpay_service_1 = require("../payment/razorpay.service");
const ledger_service_1 = require("../finance/ledger.service");
const wallet_service_1 = require("../wallet-loyalty/wallet.service");
const client_2 = require("@prisma/client");
const claim_eligibility_service_1 = require("./claim-eligibility.service");
const credit_note_service_1 = require("../compliance/credit-note.service");
let ClaimRefundService = ClaimRefundService_1 = class ClaimRefundService {
    constructor(prisma, razorpay, ledger, wallet, eligibility, creditNotes) {
        this.prisma = prisma;
        this.razorpay = razorpay;
        this.ledger = ledger;
        this.wallet = wallet;
        this.eligibility = eligibility;
        this.creditNotes = creditNotes;
        this.logger = new common_1.Logger(ClaimRefundService_1.name);
    }
    async processRefund(claimId, actorId, actorType) {
        const claim = await this.prisma.orderClaim.findUnique({
            where: { id: claimId },
            include: {
                items: { include: { product: true } },
                order: { include: { payment: true, buyerProfile: { include: { wallet: true } } } },
                refund: true,
            },
        });
        if (!claim)
            throw new common_1.BadRequestException('Claim not found');
        if (claim.refund?.status === client_1.PaymentStatus.REFUNDED) {
            return;
        }
        const amount = Number(claim.approvedAmount ?? claim.requestedAmount);
        if (amount <= 0)
            throw new common_1.BadRequestException('Refund amount must be positive');
        const idempotencyKey = `claim-refund:${claimId}`;
        const product = claim.items[0]?.product;
        const refundMethod = product
            ? this.eligibility.productToPolicy(product).refundMethod
            : client_1.ClaimRefundMethod.ORIGINAL_PAYMENT;
        let walletAmount = 0;
        let razorpayAmount = 0;
        if (refundMethod === client_1.ClaimRefundMethod.WALLET) {
            walletAmount = amount;
        }
        else if (refundMethod === client_1.ClaimRefundMethod.BOTH) {
            const razorpayPaid = Number(claim.order.razorpayAmount ?? 0);
            razorpayAmount = Math.min(amount, razorpayPaid);
            walletAmount = round(amount - razorpayAmount);
        }
        else {
            if (claim.order.paymentMethod === client_1.PaymentMethod.COD ||
                !claim.order.payment?.razorpayPaymentId) {
                walletAmount = amount;
            }
            else {
                razorpayAmount = amount;
            }
        }
        const priorRzp = await this.prisma.claimRefund.aggregate({
            where: {
                status: client_1.PaymentStatus.REFUNDED,
                claim: { orderId: claim.orderId },
                NOT: { claimId },
            },
            _sum: { razorpayAmount: true },
        });
        const orderRzpCap = Number(claim.order.razorpayAmount ?? 0);
        const remainingRzp = round(orderRzpCap - Number(priorRzp._sum.razorpayAmount ?? 0));
        if (razorpayAmount > 0) {
            razorpayAmount = Math.min(razorpayAmount, Math.max(0, remainingRzp));
        }
        walletAmount = Math.min(walletAmount, round(amount - razorpayAmount));
        let refundRecord = await this.prisma.claimRefund.findUnique({ where: { claimId } });
        if (!refundRecord) {
            refundRecord = await this.prisma.claimRefund.create({
                data: {
                    claimId,
                    amount,
                    walletAmount,
                    razorpayAmount,
                    status: client_1.PaymentStatus.PENDING,
                    idempotencyKey,
                },
            });
        }
        else if (refundRecord.status === client_1.PaymentStatus.REFUNDED) {
            return;
        }
        else {
            refundRecord = await this.prisma.claimRefund.update({
                where: { id: refundRecord.id },
                data: {
                    amount,
                    walletAmount,
                    razorpayAmount,
                },
            });
        }
        let razorpayRefundId = refundRecord.razorpayRefundId;
        let walletTxnId = refundRecord.walletTxnId;
        if (razorpayAmount > 0 && !razorpayRefundId) {
            const paymentId = claim.order.payment?.razorpayPaymentId;
            if (!paymentId || !this.razorpay.isConfigured()) {
                walletAmount = round(walletAmount + razorpayAmount);
                razorpayAmount = 0;
            }
            else {
                const result = await this.razorpay.createRefund(paymentId, razorpayAmount, { claimId, claimNumber: claim.claimNumber });
                razorpayRefundId = result.id;
                refundRecord = await this.prisma.claimRefund.update({
                    where: { id: refundRecord.id },
                    data: { razorpayRefundId, razorpayAmount },
                });
                const existingTxn = await this.prisma.paymentTransaction.findFirst({
                    where: { razorpayRefundId: result.id },
                });
                if (!existingTxn && claim.order.payment) {
                    await this.prisma.paymentTransaction.create({
                        data: {
                            paymentId: claim.order.payment.id,
                            type: 'REFUND',
                            amount: razorpayAmount,
                            status: client_1.PaymentStatus.REFUNDED,
                            razorpayRefundId: result.id,
                            metadata: { claimId },
                        },
                    });
                }
            }
        }
        if (walletAmount > 0 && !walletTxnId) {
            const buyerWallet = claim.order.buyerProfile.wallet;
            if (!buyerWallet)
                throw new common_1.BadRequestException('Buyer wallet not found for refund');
            const txn = await this.prisma.$transaction(async (tx) => this.wallet.creditWallet(tx, buyerWallet.id, walletAmount, client_2.WalletTransactionType.REFUND, {
                referenceType: 'claim',
                referenceId: claimId,
                description: `Refund for claim ${claim.claimNumber}`,
                idempotencyKey: `claim-wallet:${claimId}`,
                createdBy: actorId,
            }));
            walletTxnId = txn.id;
            await this.wallet.emitWalletCredited(buyerWallet.id, claim.buyerProfileId, walletAmount, claimId);
            void this.ledger.recordWalletCredit(walletTxnId, walletAmount).catch((err) => {
                this.logger.error({ err, claimId }, 'Claim wallet ledger failed');
            });
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.claimRefund.update({
                where: { id: refundRecord.id },
                data: {
                    walletAmount,
                    razorpayAmount,
                    razorpayRefundId,
                    walletTxnId,
                    status: client_1.PaymentStatus.REFUNDED,
                    processedAt: new Date(),
                },
            });
            await tx.orderClaim.update({
                where: { id: claimId },
                data: {
                    status: client_1.OrderClaimStatus.REFUND_PROCESSED,
                    resolvedAt: new Date(),
                },
            });
            await this.eligibility.appendHistory(tx, claimId, client_1.OrderClaimStatus.REFUND_PROCESSED, actorType, actorId, `Refund processed: ₹${amount}`, { walletAmount, razorpayAmount, razorpayRefundId });
        });
        void this.ledger.recordClaimRefund(claimId, claim.orderId, amount).catch((err) => {
            this.logger.error({ err, claimId }, 'Claim refund ledger failed');
        });
        void this.creditNotes
            .createForRefund(claim.orderId, `Claim refund ${claim.claimNumber}`, claim.items.map((i) => ({
            orderItemId: i.orderItemId,
            quantity: i.quantityApproved ?? i.quantityClaimed,
        })))
            .catch((err) => {
            this.logger.error({ err, claimId }, 'Claim credit note failed');
        });
    }
};
exports.ClaimRefundService = ClaimRefundService;
exports.ClaimRefundService = ClaimRefundService = ClaimRefundService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        razorpay_service_1.RazorpayService,
        ledger_service_1.LedgerService,
        wallet_service_1.WalletService,
        claim_eligibility_service_1.ClaimEligibilityService,
        credit_note_service_1.CreditNoteService])
], ClaimRefundService);
function round(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=claim-refund.service.js.map