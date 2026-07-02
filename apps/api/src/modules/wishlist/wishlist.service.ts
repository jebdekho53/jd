import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  INVENTORY_EVENTS,
  type InventoryBackInStockEvent,
} from '../inventory/inventory.events';

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async requireBuyerProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Buyer profile not found');
    return profile.id;
  }

  async list(userId: string) {
    const buyerProfileId = await this.requireBuyerProfileId(userId);
    const items = await this.prisma.wishlistItem.findMany({
      where: { buyerProfileId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        productId: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            unit: true,
            basePrice: true,
            imageUrls: true,
            store: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    return items.map((i) => ({
      id: i.id,
      productId: i.productId,
      addedAt: i.createdAt,
      name: i.product.name,
      unit: i.product.unit,
      price: Number(i.product.basePrice),
      imageUrl: i.product.imageUrls[0] ?? null,
      store: i.product.store,
    }));
  }

  async add(userId: string, productId: string) {
    const buyerProfileId = await this.requireBuyerProfileId(userId);
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    await this.prisma.wishlistItem.upsert({
      where: { buyerProfileId_productId: { buyerProfileId, productId } },
      create: { buyerProfileId, productId },
      update: {},
    });
    return { productId, wishlisted: true };
  }

  async remove(userId: string, productId: string) {
    const buyerProfileId = await this.requireBuyerProfileId(userId);
    await this.prisma.wishlistItem.deleteMany({ where: { buyerProfileId, productId } });
    return { productId, wishlisted: false };
  }

  /**
   * When a product comes back in stock, drop an in-app notification into the
   * feed (Part 4) for every buyer who wishlisted it.
   */
  @OnEvent(INVENTORY_EVENTS.BACK_IN_STOCK)
  async onBackInStock(payload: InventoryBackInStockEvent): Promise<void> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: payload.productId },
        select: { name: true },
      });
      if (!product) return;

      const wishlisters = await this.prisma.wishlistItem.findMany({
        where: { productId: payload.productId },
        select: { buyerProfile: { select: { userId: true } } },
      });
      if (wishlisters.length === 0) return;

      await this.prisma.notification.createMany({
        data: wishlisters.map((w) => ({
          userId: w.buyerProfile.userId,
          type: NotificationType.INVENTORY_ALERT,
          title: 'Back in stock',
          body: `${product.name} is back in stock. Grab it before it runs out!`,
        })),
      });
      this.logger.log(
        { productId: payload.productId, notified: wishlisters.length },
        'Back-in-stock notifications queued',
      );
    } catch (err) {
      this.logger.error(
        { productId: payload.productId, error: (err as Error).message },
        'Failed to send back-in-stock notifications',
      );
    }
  }
}
