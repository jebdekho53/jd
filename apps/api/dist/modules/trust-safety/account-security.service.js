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
exports.AccountSecurityService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const device_fingerprint_service_1 = require("./device-fingerprint.service");
const risk_engine_service_1 = require("./risk-engine.service");
const trust_alert_service_1 = require("./trust-alert.service");
let AccountSecurityService = class AccountSecurityService {
    constructor(prisma, devices, risk, alerts) {
        this.prisma = prisma;
        this.devices = devices;
        this.risk = risk;
        this.alerts = alerts;
    }
    async onOtpRequest(phone, ipAddress, deviceId, userAgent) {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const count = await this.prisma.otpVerification.count({
            where: { phone, createdAt: { gte: hourAgo } },
        });
        if (count >= 10) {
            await this.alerts.raise(client_1.TrustAlertType.BOT_TRAFFIC, 'HIGH', 'OTP velocity abuse', `${count} OTP requests for ${phone.slice(-4)} in 1 hour`, { phone, ipAddress });
        }
        void deviceId;
        void userAgent;
    }
    async onOtpVerified(userId, ctx) {
        const device = await this.devices.track(userId, ctx);
        const priorSessions = await this.prisma.loginSession.count({
            where: { userId, revokedAt: null },
        });
        const isNewDevice = priorSessions === 0;
        const sessionToken = ctx.sessionToken ?? (0, crypto_1.randomBytes)(32).toString('hex');
        await this.prisma.loginSession.create({
            data: {
                userId,
                sessionToken,
                deviceFingerprintId: device?.id,
                ipAddress: ctx.ipAddress,
                userAgent: ctx.userAgent,
                isNewDevice,
                verifiedAt: new Date(),
            },
        });
        if (isNewDevice && priorSessions > 0) {
            await this.risk.recordEvent({
                userId,
                eventType: 'NEW_DEVICE_LOGIN',
                severity: 'MEDIUM',
                idempotencyKey: `new-device:${userId}:${ctx.deviceId ?? sessionToken}`,
                metadata: ctx,
            });
            await this.alerts.raise(client_1.TrustAlertType.ACCOUNT_TAKEOVER, 'MEDIUM', 'New device login', `User logged in from a new device`, { userId });
        }
    }
    async auditOtpRecord(otpId, ipAddress, deviceId, userAgent) {
        await this.prisma.otpVerification.update({
            where: { id: otpId },
            data: { ipAddress, deviceId, userAgent },
        });
    }
};
exports.AccountSecurityService = AccountSecurityService;
exports.AccountSecurityService = AccountSecurityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        device_fingerprint_service_1.DeviceFingerprintService,
        risk_engine_service_1.RiskEngineService,
        trust_alert_service_1.TrustAlertService])
], AccountSecurityService);
//# sourceMappingURL=account-security.service.js.map