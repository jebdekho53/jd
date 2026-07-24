import { Injectable } from '@nestjs/common';
import { PushDeviceType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { WebPushService } from './web-push.service';
import { PushSubscribeDto, PushUnsubscribeDto } from './dto/push-subscribe.dto';

/**
 * Web-push subscription storage. Role-agnostic: subscriptions are keyed by
 * userId, so buyers and riders share it — only the controllers differ, because
 * only the guarded route differs.
 */
@Injectable()
export class PushSubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webPush: WebPushService,
  ) {}

  getStatus(userId: string) {
    return this.prisma.pushSubscription.count({
      where: { userId, isActive: true },
    });
  }

  async getPushStatus(userId: string) {
    const activeCount = await this.getStatus(userId);
    return {
      configured: this.webPush.isConfigured(),
      publicKey: this.webPush.isConfigured() ? this.webPush.getPublicKey() : null,
      subscribed: activeCount > 0,
      activeSubscriptions: activeCount,
    };
  }

  async subscribe(userId: string, dto: PushSubscribeDto) {
    const deviceType = dto.deviceType ?? PushDeviceType.UNKNOWN;
    const now = new Date();

    return this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
        userAgent: dto.userAgent,
        deviceType,
        isActive: true,
        lastSeenAt: now,
      },
      update: {
        userId,
        p256dh: dto.p256dh,
        auth: dto.auth,
        userAgent: dto.userAgent,
        deviceType,
        isActive: true,
        lastSeenAt: now,
      },
    });
  }

  async unsubscribe(userId: string, dto: PushUnsubscribeDto) {
    const result = await this.prisma.pushSubscription.updateMany({
      where: { userId, endpoint: dto.endpoint },
      data: { isActive: false },
    });
    return { updated: result.count };
  }
}
