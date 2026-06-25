import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { TrustAlertType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DeviceFingerprintService, DeviceContext } from './device-fingerprint.service';
import { RiskEngineService } from './risk-engine.service';
import { TrustAlertService } from './trust-alert.service';

@Injectable()
export class AccountSecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly devices: DeviceFingerprintService,
    private readonly risk: RiskEngineService,
    private readonly alerts: TrustAlertService,
  ) {}

  async onOtpRequest(phone: string, ipAddress?: string, deviceId?: string, userAgent?: string) {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await this.prisma.otpVerification.count({
      where: { phone, createdAt: { gte: hourAgo } },
    });
    if (count >= 10) {
      await this.alerts.raise(
        TrustAlertType.BOT_TRAFFIC,
        'HIGH',
        'OTP velocity abuse',
        `${count} OTP requests for ${phone.slice(-4)} in 1 hour`,
        { phone, ipAddress },
      );
    }

    void deviceId;
    void userAgent;
  }

  async onOtpVerified(userId: string, ctx: DeviceContext & { sessionToken?: string }) {
    const device = await this.devices.track(userId, ctx);

    const priorSessions = await this.prisma.loginSession.count({
      where: { userId, revokedAt: null },
    });
    const isNewDevice = priorSessions === 0;

    const sessionToken = ctx.sessionToken ?? randomBytes(32).toString('hex');
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
        metadata: ctx as unknown as Record<string, unknown>,
      });
      await this.alerts.raise(
        TrustAlertType.ACCOUNT_TAKEOVER,
        'MEDIUM',
        'New device login',
        `User logged in from a new device`,
        { userId },
      );
    }
  }

  async auditOtpRecord(otpId: string, ipAddress?: string, deviceId?: string, userAgent?: string) {
    await this.prisma.otpVerification.update({
      where: { id: otpId },
      data: { ipAddress, deviceId, userAgent },
    });
  }
}
