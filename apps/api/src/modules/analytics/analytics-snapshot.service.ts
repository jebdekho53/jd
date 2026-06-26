import { Injectable } from '@nestjs/common';
import { AnalyticsSnapshotScope, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { istHourRange, startOfIstDay } from '../../common/utils/ist-day.util';
import type { HourlyMetrics, MerchantRollupMetrics, PlatformDailyMetrics } from './analytics-metrics.types';

@Injectable()
export class AnalyticsSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertDaily(
    scope: AnalyticsSnapshotScope,
    scopeId: string | null,
    snapshotDate: Date,
    metrics: PlatformDailyMetrics | MerchantRollupMetrics | Record<string, unknown>,
  ) {
    const dateOnly = startOfIstDay(snapshotDate);
    const json = metrics as unknown as Prisma.InputJsonValue;

    const existing = await this.prisma.analyticsDailySnapshot.findFirst({
      where: { scope, scopeId, snapshotDate: dateOnly },
    });

    if (existing) {
      return this.prisma.analyticsDailySnapshot.update({
        where: { id: existing.id },
        data: { metrics: json },
      });
    }

    return this.prisma.analyticsDailySnapshot.create({
      data: { scope, scopeId, snapshotDate: dateOnly, metrics: json },
    });
  }

  async upsertHourly(
    scope: AnalyticsSnapshotScope,
    scopeId: string | null,
    bucketAt: Date,
    metrics: HourlyMetrics,
  ) {
    const bucket = istHourRange(bucketAt).start;
    const json = metrics as unknown as Prisma.InputJsonValue;

    const existing = await this.prisma.analyticsHourlySnapshot.findFirst({
      where: { scope, scopeId, bucketAt: bucket },
    });

    if (existing) {
      return this.prisma.analyticsHourlySnapshot.update({
        where: { id: existing.id },
        data: { metrics: json },
      });
    }

    return this.prisma.analyticsHourlySnapshot.create({
      data: { scope, scopeId, bucketAt: bucket, metrics: json },
    });
  }

  async getDaily(
    scope: AnalyticsSnapshotScope,
    scopeId: string | null,
    snapshotDate: Date,
  ) {
    const dateOnly = startOfIstDay(snapshotDate);

    return this.prisma.analyticsDailySnapshot.findFirst({
      where: { scope, scopeId, snapshotDate: dateOnly },
    });
  }

  async listDaily(
    scope: AnalyticsSnapshotScope,
    scopeId: string | null,
    from: Date,
    to: Date,
  ) {
    const fromDate = startOfIstDay(from);
    const toDate = startOfIstDay(to);

    return this.prisma.analyticsDailySnapshot.findMany({
      where: {
        scope,
        scopeId: scopeId ?? null,
        snapshotDate: { gte: fromDate, lte: toDate },
      },
      orderBy: { snapshotDate: 'asc' },
    });
  }

  async listHourly(
    scope: AnalyticsSnapshotScope,
    scopeId: string | null,
    from: Date,
    to: Date,
  ) {
    return this.prisma.analyticsHourlySnapshot.findMany({
      where: {
        scope,
        scopeId: scopeId ?? null,
        bucketAt: { gte: from, lte: to },
      },
      orderBy: { bucketAt: 'asc' },
    });
  }
}
