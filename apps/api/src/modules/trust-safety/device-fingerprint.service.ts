import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RiskEngineService } from './risk-engine.service';

export interface DeviceContext {
  deviceId?: string;
  fingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  os?: string;
  city?: string;
  state?: string;
}

@Injectable()
export class DeviceFingerprintService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly risk: RiskEngineService,
  ) {}

  async track(userId: string | undefined, ctx: DeviceContext) {
    if (!ctx.deviceId || !ctx.fingerprint) return null;

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

  async countAccountsOnDevice(fingerprint: string): Promise<number> {
    return this.prisma.deviceFingerprint.count({
      where: { fingerprint, userId: { not: null } },
    });
  }

  async countReferralsOnDevice(fingerprint: string): Promise<number> {
    return this.prisma.referral.count({
      where: { deviceFingerprint: fingerprint },
    });
  }
}
