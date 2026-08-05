import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ChatSenderType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrderChatService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(messages: { id: string; senderType: ChatSenderType; body: string; createdAt: Date }[]) {
    return messages.map((m) => ({
      id: m.id,
      senderType: m.senderType,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  private async requireBuyerOwnedOrderWithRider(userId: string, orderId: string) {
    const bp = await this.prisma.buyerProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!bp) throw new NotFoundException('Buyer profile not found');

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerProfileId: bp.id },
      select: { id: true, delivery: { select: { riderProfileId: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.delivery?.riderProfileId) {
      throw new ForbiddenException('No rider assigned to this order yet');
    }
    return order;
  }

  private async requireRiderOwnedOrder(userId: string, orderId: string) {
    const rp = await this.prisma.riderProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!rp) throw new NotFoundException('Rider profile not found');

    const delivery = await this.prisma.delivery.findFirst({
      where: { orderId, riderProfileId: rp.id },
      select: { orderId: true },
    });
    if (!delivery) throw new NotFoundException('Delivery not found');
    return delivery;
  }

  async listForBuyer(userId: string, orderId: string, after?: string) {
    await this.requireBuyerOwnedOrderWithRider(userId, orderId);
    const messages = await this.prisma.orderChatMessage.findMany({
      where: { orderId, ...(after ? { createdAt: { gt: new Date(after) } } : {}) },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    return this.serialize(messages);
  }

  async sendAsBuyer(userId: string, orderId: string, body: string) {
    await this.requireBuyerOwnedOrderWithRider(userId, orderId);
    const message = await this.prisma.orderChatMessage.create({
      data: { orderId, senderType: ChatSenderType.BUYER, senderId: userId, body },
    });
    return this.serialize([message])[0];
  }

  async listForRider(userId: string, orderId: string, after?: string) {
    await this.requireRiderOwnedOrder(userId, orderId);
    const messages = await this.prisma.orderChatMessage.findMany({
      where: { orderId, ...(after ? { createdAt: { gt: new Date(after) } } : {}) },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    return this.serialize(messages);
  }

  async sendAsRider(userId: string, orderId: string, body: string) {
    await this.requireRiderOwnedOrder(userId, orderId);
    const message = await this.prisma.orderChatMessage.create({
      data: { orderId, senderType: ChatSenderType.RIDER, senderId: userId, body },
    });
    return this.serialize([message])[0];
  }
}
