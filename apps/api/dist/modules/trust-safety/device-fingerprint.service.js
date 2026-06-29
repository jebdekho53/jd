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
exports.DeviceFingerprintService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const risk_engine_service_1 = require("./risk-engine.service");
let DeviceFingerprintService = class DeviceFingerprintService {
    constructor(prisma, risk) {
        this.prisma = prisma;
        this.risk = risk;
    }
    async track(userId, ctx) {
        if (!ctx.deviceId || !ctx.fingerprint)
            return null;
        const existing = await this.prisma.deviceFingerprint.findUnique({
            where: { deviceId_fingerprint: { deviceId: ctx.deviceId, fingerprint: ctx.fingerprint } },
        });
        if (existing) {
            const distinctUsers = await this.prisma.deviceFingerprint.groupBy({
                by: ['fingerprint'],
                where: { fingerprint: ctx.fingerprint, userId: { not: null } },
                _count: { userId: true },
            });
            const accountCount = distinctUsers[0]?._count.userId ?? existing.accountCount;
            return this.prisma.deviceFingerprint.update({
                where: { id: existing.id },
                data: {
                    userId: userId ?? existing.userId,
                    ipAddress: ctx.ipAddress ?? existing.ipAddress,
                    userAgent: ctx.userAgent ?? existing.userAgent,
                    os: ctx.os ?? existing.os,
                    city: ctx.city ?? existing.city,
                    state: ctx.state ?? existing.state,
                    accountCount,
                    lastSeenAt: new Date(),
                },
            });
        }
        const device = await this.prisma.deviceFingerprint.create({
            data: {
                userId,
                deviceId: ctx.deviceId,
                fingerprint: ctx.fingerprint,
                ipAddress: ctx.ipAddress,
                userAgent: ctx.userAgent,
                os: ctx.os,
                city: ctx.city,
                state: ctx.state,
            },
        });
        if (userId) {
            const ringSize = await this.prisma.deviceFingerprint.count({
                where: { fingerprint: ctx.fingerprint },
            });
            if (ringSize >= 3) {
                await this.risk.recordEvent({
                    userId,
                    eventType: 'DEVICE_RING_DETECTED',
                    severity: 'HIGH',
                    idempotencyKey: `device-ring:${ctx.fingerprint}`,
                    metadata: { fingerprint: ctx.fingerprint, accountCount: ringSize },
                });
            }
        }
        return device;
    }
    async countAccountsOnDevice(fingerprint) {
        return this.prisma.deviceFingerprint.count({
            where: { fingerprint, userId: { not: null } },
        });
    }
    async countReferralsOnDevice(fingerprint) {
        return this.prisma.referral.count({
            where: { deviceFingerprint: fingerprint },
        });
    }
};
exports.DeviceFingerprintService = DeviceFingerprintService;
exports.DeviceFingerprintService = DeviceFingerprintService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        risk_engine_service_1.RiskEngineService])
], DeviceFingerprintService);
//# sourceMappingURL=device-fingerprint.service.js.map