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
exports.CouponFraudDetectorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const device_fingerprint_service_1 = require("./device-fingerprint.service");
const fraud_action_service_1 = require("./fraud-action.service");
const fraud_case_service_1 = require("./fraud-case.service");
const risk_engine_service_1 = require("./risk-engine.service");
let CouponFraudDetectorService = class CouponFraudDetectorService {
    constructor(prisma, devices, risk, cases, actions) {
        this.prisma = prisma;
        this.devices = devices;
        this.risk = risk;
        this.cases = cases;
        this.actions = actions;
    }
    async evaluateCouponRedemption(userId, couponId, ctx) {
        const profile = await this.risk.getOrCreateProfile(userId);
        if (profile.couponFrozen) {
            return { allowed: false, reason: 'Coupon usage restricted on your account' };
        }
        if (ctx.fingerprint) {
            const buyer = await this.prisma.buyerProfile.findUnique({ where: { userId }, select: { id: true } });
            const walletsOnDevice = await this.prisma.buyerWallet.count({
                where: { deviceFingerprint: ctx.fingerprint },
            });
            const usages = buyer
                ? await this.prisma.couponUsage.count({
                    where: {
                        couponId,
                        buyerProfileId: { not: buyer.id },
                        order: { buyerProfile: { wallet: { deviceFingerprint: ctx.fingerprint } } },
                    },
                })
                : 0;
            if (walletsOnDevice >= 2 && usages >= 1) {
                await this.flag(userId, couponId, 'COUPON_SAME_DEVICE', ctx.fingerprint);
                return { allowed: false, reason: 'Coupon already used on this device' };
            }
        }
        const coupon = await this.prisma.coupon.findUnique({
            where: { id: couponId },
            select: { firstOrderOnly: true },
        });
        if (coupon?.firstOrderOnly) {
            const buyer = await this.prisma.buyerProfile.findUnique({ where: { userId } });
            if (buyer) {
                const priorOrders = await this.prisma.order.count({
                    where: {
                        buyerProfileId: buyer.id,
                        status: { in: ['DELIVERED', 'COMPLETED', 'PAID', 'MERCHANT_ACCEPTED'] },
                    },
                });
                if (priorOrders > 0) {
                    await this.risk.recordEvent({
                        userId,
                        eventType: 'NEW_USER_OFFER_ABUSE',
                        severity: 'MEDIUM',
                        idempotencyKey: `coupon-first-order:${userId}:${couponId}`,
                    });
                    return { allowed: false, reason: 'This offer is for first-time buyers only' };
                }
            }
        }
        void this.devices.track(userId, ctx);
        return { allowed: true };
    }
    async flag(userId, couponId, rule, fingerprint) {
        const key = `coupon:${rule}:${userId}:${couponId}`;
        await this.risk.recordEvent({
            userId,
            eventType: rule,
            severity: 'HIGH',
            idempotencyKey: key,
            metadata: { couponId, fingerprint },
        });
        await this.cases.openCase({
            userId,
            category: client_1.FraudCaseCategory.COUPON_ABUSE,
            severity: 'HIGH',
            title: 'Coupon abuse',
            description: rule,
            subjectType: 'coupon',
            subjectId: couponId,
            idempotencyKey: key,
        });
        await this.actions.apply(userId, client_1.FraudDecisionAction.COUPON_FREEZE, rule, undefined, `${key}:action`);
    }
};
exports.CouponFraudDetectorService = CouponFraudDetectorService;
exports.CouponFraudDetectorService = CouponFraudDetectorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        device_fingerprint_service_1.DeviceFingerprintService,
        risk_engine_service_1.RiskEngineService,
        fraud_case_service_1.FraudCaseService,
        fraud_action_service_1.FraudActionService])
], CouponFraudDetectorService);
//# sourceMappingURL=coupon-fraud-detector.service.js.map