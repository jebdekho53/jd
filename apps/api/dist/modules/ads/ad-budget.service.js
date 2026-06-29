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
exports.AdBudgetService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
let AdBudgetService = class AdBudgetService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    activeWindowFilter() {
        const now = new Date();
        return {
            OR: [{ startAt: null }, { startAt: { lte: now } }],
            AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
        };
    }
    hasBudget(campaign) {
        if (campaign.status !== client_1.AdCampaignStatus.ACTIVE)
            return false;
        return Number(campaign.spentAmount) < Number(campaign.budget);
    }
    async canSpend(campaignId, amount) {
        const campaign = await this.prisma.adCampaign.findUnique({ where: { id: campaignId } });
        if (!campaign)
            return false;
        return Number(campaign.spentAmount) + amount <= Number(campaign.budget);
    }
    async deductSpend(campaignId, amount) {
        if (amount <= 0)
            return;
        const campaign = await this.prisma.adCampaign.findUnique({ where: { id: campaignId } });
        if (!campaign)
            return;
        const newSpent = Number(campaign.spentAmount) + amount;
        const status = newSpent >= Number(campaign.budget) ? client_1.AdCampaignStatus.COMPLETED : campaign.status;
        await this.prisma.adCampaign.update({
            where: { id: campaignId },
            data: { spentAmount: newSpent, status },
        });
    }
    async checkDailyCap(campaignId, groupDailyBudget) {
        const start = (0, ist_day_util_1.startOfIstDay)();
        const [impressions, clicks] = await Promise.all([
            this.prisma.adImpression.aggregate({
                where: { campaignId, createdAt: { gte: start } },
                _sum: { cost: true },
            }),
            this.prisma.adClick.aggregate({
                where: { campaignId, createdAt: { gte: start } },
                _sum: { cost: true },
            }),
        ]);
        const todaySpend = Number(impressions._sum.cost ?? 0) + Number(clicks._sum.cost ?? 0);
        return todaySpend < groupDailyBudget;
    }
};
exports.AdBudgetService = AdBudgetService;
exports.AdBudgetService = AdBudgetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdBudgetService);
//# sourceMappingURL=ad-budget.service.js.map