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
var TrustSafetyHookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustSafetyHookService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const referral_fraud_detector_service_1 = require("./referral-fraud-detector.service");
const wallet_fraud_detector_service_1 = require("./wallet-fraud-detector.service");
const coupon_fraud_detector_service_1 = require("./coupon-fraud-detector.service");
const cod_fraud_detector_service_1 = require("./cod-fraud-detector.service");
const rider_fraud_detector_service_1 = require("./rider-fraud-detector.service");
const merchant_fraud_detector_service_1 = require("./merchant-fraud-detector.service");
const account_security_service_1 = require("./account-security.service");
const risk_engine_service_1 = require("./risk-engine.service");
let TrustSafetyHookService = TrustSafetyHookService_1 = class TrustSafetyHookService {
    constructor(prisma, referral, wallet, coupon, cod, rider, merchant, account, risk) {
        this.prisma = prisma;
        this.referral = referral;
        this.wallet = wallet;
        this.coupon = coupon;
        this.cod = cod;
        this.rider = rider;
        this.merchant = merchant;
        this.account = account;
        this.risk = risk;
        this.logger = new common_1.Logger(TrustSafetyHookService_1.name);
    }
    async beforeReferralApply(ctx) {
        try {
            return await this.referral.evaluate(ctx);
        }
        catch (err) {
            this.logger.error({ err }, 'Referral fraud check failed');
            return { allowed: true };
        }
    }
    async beforeCodCheckout(userId) {
        try {
            return await this.cod.evaluateCodCheckout(userId);
        }
        catch (err) {
            this.logger.error({ err }, 'COD fraud check failed');
            return { allowed: true };
        }
    }
    async beforeCouponApply(userId, couponId, ctx) {
        try {
            return await this.coupon.evaluateCouponRedemption(userId, couponId, ctx);
        }
        catch (err) {
            this.logger.error({ err }, 'Coupon fraud check failed');
            return { allowed: true };
        }
    }
    async onOrderDelivered(orderId, riderProfileId, lat, lng) {
        void this.rider.evaluateDeliveryCompletion(orderId, riderProfileId, lat, lng).catch(() => { });
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                buyerProfile: { select: { userId: true } },
                store: { include: { merchantProfile: { select: { userId: true } } } },
            },
        });
        if (order?.buyerProfile?.userId && order.paymentMethod === client_1.PaymentMethod.COD) {
            void this.cod.updateBuyerCodMetrics(order.buyerProfile.userId).catch(() => { });
        }
        if (order?.store) {
            void this.merchant
                .evaluateOrderPattern(order.storeId, order.store.merchantProfile.userId)
                .catch(() => { });
        }
    }
    async onWalletCredit(walletId, amount, referenceId) {
        void this.wallet.onWalletCredit(walletId, amount, referenceId).catch(() => { });
    }
    async onOtpRequest(phone, ip, deviceId, userAgent) {
        void this.account.onOtpRequest(phone, ip, deviceId, userAgent).catch(() => { });
    }
    async onOtpVerified(userId, ctx) {
        void this.account.onOtpVerified(userId, ctx).catch(() => { });
    }
    async recalculateUser(userId) {
        return this.risk.recalculate(userId);
    }
};
exports.TrustSafetyHookService = TrustSafetyHookService;
exports.TrustSafetyHookService = TrustSafetyHookService = TrustSafetyHookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        referral_fraud_detector_service_1.ReferralFraudDetectorService,
        wallet_fraud_detector_service_1.WalletFraudDetectorService,
        coupon_fraud_detector_service_1.CouponFraudDetectorService,
        cod_fraud_detector_service_1.CodFraudDetectorService,
        rider_fraud_detector_service_1.RiderFraudDetectorService,
        merchant_fraud_detector_service_1.MerchantFraudDetectorService,
        account_security_service_1.AccountSecurityService,
        risk_engine_service_1.RiskEngineService])
], TrustSafetyHookService);
//# sourceMappingURL=trust-safety-hook.service.js.map