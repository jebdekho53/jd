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
exports.WalletLoyaltyCheckoutService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const reward_config_service_1 = require("./reward-config.service");
const reward_service_1 = require("./reward.service");
const wallet_service_1 = require("./wallet.service");
let WalletLoyaltyCheckoutService = class WalletLoyaltyCheckoutService {
    constructor(wallet, reward, config) {
        this.wallet = wallet;
        this.reward = reward;
        this.config = config;
    }
    async computeCheckoutPayment(input) {
        const rules = await this.config.getRules();
        const buyerWallet = await this.wallet.getOrCreateWallet(input.buyerProfileId);
        const pointsToRedeem = Math.max(0, input.rewardPointsToRedeem ?? 0);
        if (pointsToRedeem > buyerWallet.rewardPoints) {
            throw new common_1.BadRequestException('Insufficient reward points');
        }
        const pointsDiscount = this.reward.computePointsDiscount(pointsToRedeem, rules);
        let amountDue = Math.max(0, round(input.grandTotal - pointsDiscount));
        const requestedWallet = Math.max(0, input.walletAmountToUse ?? 0);
        const walletBalance = Number(buyerWallet.balance);
        const walletAmountUsed = Math.min(requestedWallet, walletBalance, amountDue);
        amountDue = round(amountDue - walletAmountUsed);
        const razorpayAmount = amountDue;
        let resolvedPaymentMethod;
        let initialOrderStatus;
        let initialPaymentStatus;
        if (amountDue <= 0 && walletAmountUsed > 0) {
            resolvedPaymentMethod = client_1.PaymentMethod.WALLET;
            initialOrderStatus = client_1.OrderStatus.MERCHANT_ACCEPTED;
            initialPaymentStatus = client_1.PaymentStatus.PAID;
        }
        else if (walletAmountUsed > 0 && input.paymentMethod === 'RAZORPAY') {
            resolvedPaymentMethod = client_1.PaymentMethod.WALLET_RAZORPAY;
            initialOrderStatus = client_1.OrderStatus.PAYMENT_PENDING;
            initialPaymentStatus = client_1.PaymentStatus.PENDING;
        }
        else if (walletAmountUsed > 0 && input.paymentMethod === 'COD') {
            resolvedPaymentMethod = client_1.PaymentMethod.WALLET_COD;
            initialOrderStatus = client_1.OrderStatus.MERCHANT_ACCEPTED;
            initialPaymentStatus = client_1.PaymentStatus.PENDING;
        }
        else if (input.paymentMethod === 'COD') {
            resolvedPaymentMethod = client_1.PaymentMethod.COD;
            initialOrderStatus = client_1.OrderStatus.MERCHANT_ACCEPTED;
            initialPaymentStatus = client_1.PaymentStatus.PENDING;
        }
        else {
            resolvedPaymentMethod = client_1.PaymentMethod.RAZORPAY;
            initialOrderStatus = client_1.OrderStatus.PAYMENT_PENDING;
            initialPaymentStatus = client_1.PaymentStatus.PENDING;
        }
        return {
            walletAmountUsed,
            rewardPointsUsed: pointsToRedeem,
            pointsDiscount,
            amountDue: round(input.grandTotal - pointsDiscount),
            razorpayAmount,
            resolvedPaymentMethod,
            initialOrderStatus,
            initialPaymentStatus,
        };
    }
    async applyCheckoutDeductions(tx, walletId, orderId, walletAmountUsed, rewardPointsUsed) {
        if (rewardPointsUsed > 0) {
            await this.reward.redeemPoints(tx, walletId, rewardPointsUsed, orderId);
        }
        if (walletAmountUsed > 0) {
            await this.wallet.debitWallet(tx, walletId, walletAmountUsed, {
                referenceType: 'order',
                referenceId: orderId,
                description: `Payment for order ${orderId}`,
                idempotencyKey: `wallet-debit:${orderId}`,
            });
        }
    }
    async processOrderCompleted(orderId) {
        await this.reward.creditPointsForOrder(orderId);
    }
};
exports.WalletLoyaltyCheckoutService = WalletLoyaltyCheckoutService;
exports.WalletLoyaltyCheckoutService = WalletLoyaltyCheckoutService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [wallet_service_1.WalletService,
        reward_service_1.RewardService,
        reward_config_service_1.RewardConfigService])
], WalletLoyaltyCheckoutService);
function round(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=wallet-loyalty-checkout.service.js.map