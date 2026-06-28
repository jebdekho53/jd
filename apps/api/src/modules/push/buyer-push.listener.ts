import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WALLET_LOYALTY_EVENTS } from '../wallet-loyalty/wallet-loyalty.events';
import { PrismaService } from '../../database/prisma.service';
import { BuyerPushNotificationService } from './buyer-push-notification.service';
import { BUYER_PUSH_EVENTS, type BuyerPushSupportReplyEvent } from './buyer-push.events';

@Injectable()
export class BuyerPushListener {
  constructor(
    private readonly push: BuyerPushNotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(WALLET_LOYALTY_EVENTS.WALLET_CREDITED)
  async onWalletCredited(payload: { buyerProfileId: string; amount: number }): Promise<void> {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { id: payload.buyerProfileId },
      select: { userId: true },
    });
    if (!profile) return;
    await this.push.notifyWalletCredited(profile.userId, payload.amount);
  }

  @OnEvent(BUYER_PUSH_EVENTS.SUPPORT_REPLY)
  async onSupportReply(payload: BuyerPushSupportReplyEvent): Promise<void> {
    await this.push.notifySupportReply(payload.userId, payload.ticketId, payload.ticketNumber);
  }
}
