import { Injectable, Inject, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel, NotificationDeliveryStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { Msg91Service } from '../auth/msg91.service';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';
import type { BuyerPushKind } from '../push/buyer-push.events';
import { getConfig } from '../../config/configuration';
import { SMS_WHATSAPP_DISABLED_LOG } from '../auth/auth.constants';

export interface SendNotificationInput {
  userId: string;
  channel: NotificationChannel;
  templateCode: string;
  type?: NotificationType;
  title?: string;
  variables?: Record<string, string>;
}

@Injectable()
export class NotificationOrchestratorService {
  private readonly logger = new Logger(NotificationOrchestratorService.name);
  private readonly cfg: ReturnType<typeof getConfig>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly sms: Msg91Service,
    @Inject(forwardRef(() => BuyerPushNotificationService))
    private readonly buyerPush: BuyerPushNotificationService,
    configService: ConfigService,
  ) {
    this.cfg = getConfig(configService);
  }

  async listTemplates(category?: string) {
    return this.prisma.notificationTemplate.findMany({
      where: { isActive: true, ...(category ? { category } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updatePreferences(userId: string, data: Record<string, boolean>) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async canSend(userId: string, channel: NotificationChannel, category: string): Promise<boolean> {
    const prefs = await this.getPreferences(userId);
    if (!prefs.marketingConsent && ['OFFERS', 'REFERRALS', 'MARKETING'].includes(category)) {
      return false;
    }
    switch (channel) {
      case NotificationChannel.PUSH:
        return prefs.pushEnabled;
      case NotificationChannel.EMAIL:
        return prefs.emailEnabled;
      case NotificationChannel.SMS:
        return prefs.smsEnabled;
      case NotificationChannel.WHATSAPP:
        return prefs.whatsappEnabled;
      case NotificationChannel.IN_APP:
        return true;
      default:
        return true;
    }
  }

  async send(input: SendNotificationInput) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { code: input.templateCode },
    });
    if (!template || !template.isActive) {
      throw new Error(`Template ${input.templateCode} not found`);
    }

    const allowed = await this.canSend(input.userId, input.channel, template.category);
    if (!allowed) return { skipped: true, reason: 'preferences' };

    if (input.channel === NotificationChannel.SMS && !this.cfg.auth.smsEnabled) {
      this.logger.log({ userId: input.userId, channel: input.channel }, SMS_WHATSAPP_DISABLED_LOG);
      return { skipped: true, reason: 'sms_disabled' };
    }

    if (input.channel === NotificationChannel.WHATSAPP && !this.cfg.auth.whatsappEnabled) {
      this.logger.log({ userId: input.userId, channel: input.channel }, SMS_WHATSAPP_DISABLED_LOG);
      return { skipped: true, reason: 'whatsapp_disabled' };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { phone: true, email: true },
    });
    if (!user) return { skipped: true, reason: 'user_not_found' };

    let body = template.body;
    let subject = template.subject ?? input.title ?? template.name;
    if (input.variables) {
      for (const [k, v] of Object.entries(input.variables)) {
        body = body.replace(new RegExp(`{{${k}}}`, 'g'), v);
        subject = subject.replace(new RegExp(`{{${k}}}`, 'g'), v);
      }
    }

    const recipient =
      input.channel === NotificationChannel.EMAIL ? (user.email ?? user.phone) : user.phone;

    const notification =
      input.channel === NotificationChannel.IN_APP || input.channel === NotificationChannel.PUSH
        ? await this.prisma.notification.create({
            data: {
              userId: input.userId,
              type: input.type ?? NotificationType.MARKETING,
              title: subject,
              body,
            },
          })
        : null;

    const delivery = await this.prisma.notificationDelivery.create({
      data: {
        notificationId: notification?.id,
        userId: input.userId,
        templateId: template.id,
        channel: input.channel,
        recipient,
        subject,
        body,
        status: NotificationDeliveryStatus.PENDING,
        queuedAt: new Date(),
      },
    });

    try {
      switch (input.channel) {
        case NotificationChannel.EMAIL:
          if (!user.email) throw new Error('No email on file');
          await this.email.send({
            to: user.email,
            subject,
            html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
            text: body,
          });
          break;
        case NotificationChannel.SMS:
        case NotificationChannel.WHATSAPP:
          if (!user.phone) throw new Error('No phone on file');
          await this.sms.sendTransactional(user.phone, body);
          break;
        case NotificationChannel.PUSH:
          await this.buyerPush.sendGeneric(
            input.userId,
            this.templateCategoryToPushKind(template.category),
            subject,
            body,
          );
          break;
        case NotificationChannel.IN_APP:
          break;
        default:
          break;
      }

      const updated = await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: NotificationDeliveryStatus.SENT,
          sentAt: new Date(),
          deliveredAt: new Date(),
        },
      });

      return { delivery: updated, notification };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delivery failed';
      this.logger.warn({ err, userId: input.userId, channel: input.channel }, 'Notification delivery failed');
      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: NotificationDeliveryStatus.FAILED,
          failedAt: new Date(),
          errorMessage: message,
        },
      });
      return { delivery, notification, failed: true, error: message };
    }
  }

  async listInApp(userId: string, page = 1, limit = 20) {
    const [items, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, total, unread, page, limit };
  }

  async markInAppRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllInAppRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async listDeliveries(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.notificationDelivery.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notificationDelivery.count({ where: { userId } }),
    ]);
    return { items, total, page, limit };
  }

  private templateCategoryToPushKind(category: string): BuyerPushKind {
    if (category === 'OFFERS' || category === 'MARKETING') return 'OFFER_AVAILABLE';
    if (category === 'SUPPORT') return 'SUPPORT_REPLY';
    if (category === 'WALLET') return 'WALLET_CREDITED';
    return 'ORDER_PLACED';
  }
}
