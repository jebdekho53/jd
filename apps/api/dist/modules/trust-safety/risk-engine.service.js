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
exports.RiskEngineService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let RiskEngineService = class RiskEngineService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreateProfile(userId) {
        return this.prisma.riskProfile.upsert({
            where: { userId },
            create: { userId },
            update: {},
        });
    }
    async recordEvent(input) {
        const existing = await this.prisma.riskEvent.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
        });
        if (existing)
            return existing;
        const event = await this.prisma.riskEvent.create({
            data: {
                userId: input.userId,
                eventType: input.eventType,
                severity: input.severity,
                idempotencyKey: input.idempotencyKey,
                subjectType: input.subjectType,
                subjectId: input.subjectId,
                metadata: input.metadata,
            },
        });
        if (input.userId) {
            await this.recalculate(input.userId);
        }
        return event;
    }
    async recalculate(userId) {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [events, restrictions, openCases] = await Promise.all([
            this.prisma.riskEvent.findMany({
                where: { userId, createdAt: { gte: since } },
                orderBy: { createdAt: 'desc' },
                take: 200,
            }),
            this.prisma.accountRestriction.count({ where: { userId, active: true } }),
            this.prisma.fraudCase.count({
                where: { userId, status: { in: ['OPEN', 'INVESTIGATING'] } },
            }),
        ]);
        const severityWeight = {
            LOW: 2,
            MEDIUM: 8,
            HIGH: 20,
            CRITICAL: 40,
        };
        let fraudScore = 0;
        for (const e of events) {
            fraudScore += severityWeight[e.severity] ?? 5;
        }
        fraudScore += openCases * 15;
        fraudScore += restrictions * 10;
        fraudScore = Math.min(100, fraudScore);
        const riskScore = Math.min(100, Math.round(fraudScore * 0.85 + openCases * 5));
        const trustScore = Math.max(0, 100 - riskScore);
        let status = client_1.RiskProfileStatus.CLEAR;
        if (riskScore >= 80 || restrictions > 2)
            status = client_1.RiskProfileStatus.BLOCKED;
        else if (riskScore >= 50 || openCases > 0)
            status = client_1.RiskProfileStatus.REVIEW;
        else if (riskScore >= 25)
            status = client_1.RiskProfileStatus.WATCHLIST;
        await this.prisma.riskProfile.upsert({
            where: { userId },
            create: {
                userId,
                riskScore,
                trustScore,
                fraudScore,
                status,
                lastEvaluatedAt: new Date(),
            },
            update: {
                riskScore,
                trustScore,
                fraudScore,
                status,
                lastEvaluatedAt: new Date(),
            },
        });
        return { riskScore, trustScore, fraudScore, status };
    }
    async isBlocked(userId) {
        const profile = await this.getOrCreateProfile(userId);
        if (profile.status === client_1.RiskProfileStatus.BLOCKED)
            return true;
        const hard = await this.prisma.accountRestriction.findFirst({
            where: {
                userId,
                active: true,
                restrictionType: { in: ['HARD_BLOCK', 'MERCHANT_SUSPEND', 'RIDER_SUSPEND'] },
            },
        });
        return Boolean(hard);
    }
    async canUseCod(userId) {
        const profile = await this.getOrCreateProfile(userId);
        if (!profile.codEnabled)
            return false;
        const buyer = await this.prisma.buyerProfile.findUnique({
            where: { userId },
            select: { codEnabled: true },
        });
        if (buyer && !buyer.codEnabled)
            return false;
        const restriction = await this.prisma.accountRestriction.findFirst({
            where: { userId, active: true, restrictionType: 'COD_DISABLE' },
        });
        return !restriction && profile.riskScore < 60;
    }
};
exports.RiskEngineService = RiskEngineService;
exports.RiskEngineService = RiskEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RiskEngineService);
//# sourceMappingURL=risk-engine.service.js.map