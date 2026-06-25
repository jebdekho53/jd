import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationDeliveryStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

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
        status: NotificationDeliveryStatus.SENT,
        sentAt: new Date(),
        deliveredAt: new Date(),
      },
    });

    return { delivery, notification };
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
}
