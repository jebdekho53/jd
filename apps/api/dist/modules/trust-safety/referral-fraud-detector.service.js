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
exports.ReferralFraudDetectorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const device_fingerprint_service_1 = require("./device-fingerprint.service");
const fraud_action_service_1 = require("./fraud-action.service");
const fraud_case_service_1 = require("./fraud-case.service");
const risk_engine_service_1 = require("./risk-engine.service");
const trust_alert_service_1 = require("./trust-alert.service");
let ReferralFraudDetectorService = class ReferralFraudDetectorService {
    constructor(prisma, devices, cases, actions, risk, alerts) {
        this.prisma = prisma;
        this.devices = devices;
        this.cases = cases;
        this.actions = actions;
        this.risk = risk;
        this.alerts = alerts;
    }
    async evaluate(ctx) {
        const referred = await this.prisma.buyerProfile.findUnique({
            where: { id: ctx.buyerProfileId },
            select: { userId: true },
        });
        const referrerWallet = await this.prisma.buyerWallet.findUnique({
            where: { id: ctx.referrerWalletId },
            include: { buyerProfile: { select: { userId: true } } },
        });
        if (!referred || !referrerWallet)
            return { allowed: true };
        if (referrerWallet.buyerProfileId === ctx.buyerProfileId) {
            await this.flag(referred.userId, 'SELF_REFERRAL', 'Self referral attempt', ctx);
            return { allowed: false, reason: 'Cannot use your own referral code' };
        }
        if (ctx.fingerprint) {
            const sameDevice = referrerWallet.deviceFingerprint === ctx.fingerprint;
            const ring = await this.devices.countAccountsOnDevice(ctx.fingerprint);
            if (sameDevice || ring >= 3) {
                await this.flag(referred.userId, 'SAME_DEVICE_REFERRAL', 'Same device referral', ctx);
                return { allowed: false, reason: 'Referral not allowed from this device' };
            }
        }
        if (ctx.ipAddress && referrerWallet.deviceFingerprint) {
            const referrerDevice = await this.prisma.deviceFingerprint.findFirst({
                where: { fingerprint: referrerWallet.deviceFingerprint, ipAddress: ctx.ipAddress },
            });
            if (referrerDevice) {
                await this.flag(referred.userId, 'SAME_IP_REFERRAL', 'Same IP referral', ctx);
                return { allowed: false, reason: 'Referral not allowed from this network' };
            }
        }
        if (ctx.deliveryAddress) {
            const prior = await this.prisma.referral.count({
                where: {
                    referrerWalletId: ctx.referrerWalletId,
                    status: { in: [client_1.ReferralStatus.PENDING, client_1.ReferralStatus.COMPLETED] },
                },
            });
            void prior;
        }
        void this.devices.track(referred.userId, ctx);
        return { allowed: true };
    }
    async flag(userId, rule, title, ctx) {
        const key = `referral:${rule}:${ctx.buyerProfileId}:${ctx.referralCode}`;
        await this.risk.recordEvent({
            userId,
            eventType: rule,
            severity: 'HIGH',
            idempotencyKey: key,
            metadata: ctx,
        });
        const fraudCase = await this.cases.openCase({
            userId,
            category: client_1.FraudCaseCategory.REFERRAL_ABUSE,
            severity: 'HIGH',
            title,
            description: `Referral abuse detected: ${rule}`,
            subjectType: 'referral',
            subjectId: ctx.referredWalletId,
            idempotencyKey: key,
        });
        await this.actions.apply(userId, client_1.FraudDecisionAction.REFERRAL_FREEZE, title, undefined, `${key}:action`);
        await this.alerts.raise(client_1.TrustAlertType.REFERRAL_ABUSE, 'HIGH', title, `Case ${fraudCase.caseNumber}: ${rule}`, { userId, caseId: fraudCase.id });
    }
};
exports.ReferralFraudDetectorService = ReferralFraudDetectorService;
exports.ReferralFraudDetectorService = ReferralFraudDetectorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        device_fingerprint_service_1.DeviceFingerprintService,
        fraud_case_service_1.FraudCaseService,
        fraud_action_service_1.FraudActionService,
        risk_engine_service_1.RiskEngineService,
        trust_alert_service_1.TrustAlertService])
], ReferralFraudDetectorService);
//# sourceMappingURL=referral-fraud-detector.service.js.map