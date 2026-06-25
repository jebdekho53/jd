import { Injectable } from '@nestjs/common';
import { Prisma, RiskProfileStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface RiskScores {
  riskScore: number;
  trustScore: number;
  fraudScore: number;
  status: RiskProfileStatus;
}

@Injectable()
export class RiskEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateProfile(userId: string) {
    return this.prisma.riskProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async recordEvent(
    input: {
      userId?: string;
      eventType: string;
      severity: string;
      idempotencyKey: string;
      subjectType?: string;
      subjectId?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const existing = await this.prisma.riskEvent.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return existing;

    const event = await this.prisma.riskEvent.create({
      data: {
        userId: input.userId,
        eventType: input.eventType,
        severity: input.severity,
        idempotencyKey: input.idempotencyKey,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    if (input.userId) {
      await this.recalculate(input.userId);
    }
    return event;
  }

  async recalculate(userId: string): Promise<RiskScores> {
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

    const severityWeight: Record<string, number> = {
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

    let status: RiskProfileStatus = RiskProfileStatus.CLEAR;
    if (riskScore >= 80 || restrictions > 2) status = RiskProfileStatus.BLOCKED;
    else if (riskScore >= 50 || openCases > 0) status = RiskProfileStatus.REVIEW;
    else if (riskScore >= 25) status = RiskProfileStatus.WATCHLIST;

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

  async isBlocked(userId: string): Promise<boolean> {
    const profile = await this.getOrCreateProfile(userId);
    if (profile.status === RiskProfileStatus.BLOCKED) return true;
    const hard = await this.prisma.accountRestriction.findFirst({
      where: {
        userId,
        active: true,
        restrictionType: { in: ['HARD_BLOCK', 'MERCHANT_SUSPEND', 'RIDER_SUSPEND'] },
      },
    });
    return Boolean(hard);
  }

  async canUseCod(userId: string): Promise<boolean> {
    const profile = await this.getOrCreateProfile(userId);
    if (!profile.codEnabled) return false;
    const buyer = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      select: { codEnabled: true },
    });
    if (buyer && !buyer.codEnabled) return false;
    const restriction = await this.prisma.accountRestriction.findFirst({
      where: { userId, active: true, restrictionType: 'COD_DISABLE' },
    });
    return !restriction && profile.riskScore < 60;
  }
}
