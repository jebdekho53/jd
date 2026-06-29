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
exports.RewardConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const DEFAULTS = {
    pointsPer100Inr: 1,
    pointValueInr: 1,
    referral: {
        referrerPoints: 50,
        referredPoints: 25,
        referrerWalletCredit: 50,
        referredWalletCredit: 100,
    },
    tierThresholds: { silver: 500, gold: 2000, platinum: 5000 },
    tierMultipliers: { BRONZE: 1, SILVER: 1.1, GOLD: 1.25, PLATINUM: 1.5 },
};
let RewardConfigService = class RewardConfigService {
    constructor(prisma) {
        this.prisma = prisma;
        this.cache = null;
        this.cacheAt = 0;
    }
    async getRules() {
        if (this.cache && Date.now() - this.cacheAt < 60_000)
            return this.cache;
        const rows = await this.prisma.rewardProgramConfig.findMany();
        const map = new Map(rows.map((r) => [r.key, r.value]));
        const rules = {
            pointsPer100Inr: num(map.get('points_per_100_inr'), DEFAULTS.pointsPer100Inr),
            pointValueInr: num(map.get('point_value_inr'), DEFAULTS.pointValueInr),
            referral: {
                referrerPoints: num(map.get('referral_rewards')?.referrerPoints, DEFAULTS.referral.referrerPoints),
                referredPoints: num(map.get('referral_rewards')?.referredPoints, DEFAULTS.referral.referredPoints),
                referrerWalletCredit: num(map.get('referral_rewards')?.referrerWalletCredit, DEFAULTS.referral.referrerWalletCredit),
                referredWalletCredit: num(map.get('referral_rewards')?.referredWalletCredit, DEFAULTS.referral.referredWalletCredit),
            },
            tierThresholds: {
                silver: num(map.get('tier_thresholds')?.silver, DEFAULTS.tierThresholds.silver),
                gold: num(map.get('tier_thresholds')?.gold, DEFAULTS.tierThresholds.gold),
                platinum: num(map.get('tier_thresholds')?.platinum, DEFAULTS.tierThresholds.platinum),
            },
            tierMultipliers: {
                BRONZE: num(map.get('tier_point_multipliers')?.BRONZE, 1),
                SILVER: num(map.get('tier_point_multipliers')?.SILVER, 1.1),
                GOLD: num(map.get('tier_point_multipliers')?.GOLD, 1.25),
                PLATINUM: num(map.get('tier_point_multipliers')?.PLATINUM, 1.5),
            },
        };
        this.cache = rules;
        this.cacheAt = Date.now();
        return rules;
    }
    async updateConfig(key, value, adminUserId) {
        const updated = await this.prisma.rewardProgramConfig.upsert({
            where: { key },
            create: { key, value: value, updatedBy: adminUserId },
            update: { value: value, updatedBy: adminUserId },
        });
        this.cache = null;
        return updated;
    }
    invalidateCache() {
        this.cache = null;
    }
};
exports.RewardConfigService = RewardConfigService;
exports.RewardConfigService = RewardConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RewardConfigService);
function num(val, fallback) {
    if (typeof val === 'number' && Number.isFinite(val))
        return val;
    if (val && typeof val === 'object' && 'value' in val) {
        const v = val.value;
        if (typeof v === 'number' && Number.isFinite(v))
            return v;
    }
    return fallback;
}
//# sourceMappingURL=reward-config.service.js.map