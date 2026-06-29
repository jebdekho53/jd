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
exports.AdFraudGuardService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const fraud_case_service_1 = require("../trust-safety/fraud-case.service");
let AdFraudGuardService = class AdFraudGuardService {
    constructor(prisma, fraudCases) {
        this.prisma = prisma;
        this.fraudCases = fraudCases;
    }
    async checkClickFraud(userId, campaignId) {
        if (!userId)
            return false;
        const since = new Date(Date.now() - 60 * 1000);
        const recent = await this.prisma.adClick.count({
            where: { userId, campaignId, createdAt: { gte: since } },
        });
        if (recent >= 5) {
            void this.fraudCases.openCase({
                userId,
                category: client_1.FraudCaseCategory.BOT_TRAFFIC,
                severity: 'MEDIUM',
                title: 'Ad click fraud suspected',
                description: `${recent} ad clicks in 60s for campaign ${campaignId}`,
                subjectType: 'ad_campaign',
                subjectId: campaignId,
                idempotencyKey: `ad-click-fraud:${userId}:${campaignId}:${Math.floor(Date.now() / 60000)}`,
            });
            return true;
        }
        return false;
    }
    async checkImpressionFraud(userId, campaignId) {
        if (!userId)
            return false;
        const since = new Date(Date.now() - 60 * 1000);
        const recent = await this.prisma.adImpression.count({
            where: { userId, campaignId, createdAt: { gte: since } },
        });
        if (recent >= 20) {
            void this.fraudCases.openCase({
                userId,
                category: client_1.FraudCaseCategory.BOT_TRAFFIC,
                severity: 'LOW',
                title: 'Ad impression fraud suspected',
                description: `${recent} impressions in 60s for campaign ${campaignId}`,
                subjectType: 'ad_campaign',
                subjectId: campaignId,
                idempotencyKey: `ad-imp-fraud:${userId}:${campaignId}:${Math.floor(Date.now() / 60000)}`,
            });
            return true;
        }
        return false;
    }
};
exports.AdFraudGuardService = AdFraudGuardService;
exports.AdFraudGuardService = AdFraudGuardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        fraud_case_service_1.FraudCaseService])
], AdFraudGuardService);
//# sourceMappingURL=ad-fraud-guard.service.js.map