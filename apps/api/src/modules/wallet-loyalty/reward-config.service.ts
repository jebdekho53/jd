import { Injectable } from '@nestjs/common';
import { LoyaltyTier } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface RewardProgramRules {
  pointsPer100Inr: number;
  pointValueInr: number;
  referral: {
    referrerPoints: number;
    referredPoints: number;
    referrerWalletCredit: number;
    referredWalletCredit: number;
  };
  tierThresholds: { silver: number; gold: number; platinum: number };
  tierMultipliers: Record<LoyaltyTier, number>;
}

const DEFAULTS: RewardProgramRules = {
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

@Injectable()
export class RewardConfigService {
  private cache: RewardProgramRules | null = null;
  private cacheAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  async getRules(): Promise<RewardProgramRules> {
    if (this.cache && Date.now() - this.cacheAt < 60_000) return this.cache;

    const rows = await this.prisma.rewardProgramConfig.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value]));

    const rules: RewardProgramRules = {
      pointsPer100Inr: num(map.get('points_per_100_inr'), DEFAULTS.pointsPer100Inr),
      pointValueInr: num(map.get('point_value_inr'), DEFAULTS.pointValueInr),
      referral: {
        referrerPoints: num((map.get('referral_rewards') as { referrerPoints?: number })?.referrerPoints, DEFAULTS.referral.referrerPoints),
        referredPoints: num((map.get('referral_rewards') as { referredPoints?: number })?.referredPoints, DEFAULTS.referral.referredPoints),
        referrerWalletCredit: num((map.get('referral_rewards') as { referrerWalletCredit?: number })?.referrerWalletCredit, DEFAULTS.referral.referrerWalletCredit),
        referredWalletCredit: num((map.get('referral_rewards') as { referredWalletCredit?: number })?.referredWalletCredit, DEFAULTS.referral.referredWalletCredit),
      },
      tierThresholds: {
        silver: num((map.get('tier_thresholds') as { silver?: number })?.silver, DEFAULTS.tierThresholds.silver),
        gold: num((map.get('tier_thresholds') as { gold?: number })?.gold, DEFAULTS.tierThresholds.gold),
        platinum: num((map.get('tier_thresholds') as { platinum?: number })?.platinum, DEFAULTS.tierThresholds.platinum),
      },
      tierMultipliers: {
        BRONZE: num((map.get('tier_point_multipliers') as Record<string, number>)?.BRONZE, 1),
        SILVER: num((map.get('tier_point_multipliers') as Record<string, number>)?.SILVER, 1.1),
        GOLD: num((map.get('tier_point_multipliers') as Record<string, number>)?.GOLD, 1.25),
        PLATINUM: num((map.get('tier_point_multipliers') as Record<string, number>)?.PLATINUM, 1.5),
      },
    };

    this.cache = rules;
    this.cacheAt = Date.now();
    return rules;
  }

  async updateConfig(key: string, value: unknown, adminUserId: string) {
    const updated = await this.prisma.rewardProgramConfig.upsert({
      where: { key },
      create: { key, value: value as object, updatedBy: adminUserId },
      update: { value: value as object, updatedBy: adminUserId },
    });
    this.cache = null;
    return updated;
  }

  invalidateCache() {
    this.cache = null;
  }
}

function num(val: unknown, fallback: number): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (val && typeof val === 'object' && 'value' in val) {
    const v = (val as { value: unknown }).value;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return fallback;
}
