import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InventoryAlertService {
  private readonly logger = new Logger(InventoryAlertService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkAndNotifyLowStock(variantId: string, actorUserId?: string): Promise<void> {
    const row = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        sku: true,
        product: {
          select: {
            id: true,
            name: true,
            store: {
              select: {
                id: true,
                name: true,
                merchantProfile: {
                  select: { userId: true, businessName: true },
                },
              },
            },
          },
        },
        inventory: {
          select: { availableQty: true, lowStockThreshold: true, status: true },
        },
      },
    });

    if (!row?.inventory) return;

    const { availableQty, lowStockThreshold } = row.inventory;
    if (availableQty > lowStockThreshold) return;

    const merchantUserId = row.product.store.merchantProfile.userId;
    const title = availableQty <= 0 ? 'Out of stock' : 'Low stock alert';
    const body =
      availableQty <= 0
        ? `${row.product.name} (${row.sku}) is out of stock at ${row.product.store.name}.`
        : `${row.product.name} (${row.sku}) has only ${availableQty} units left (threshold: ${lowStockThreshold}).`;

    const data = {
      productId: row.product.id,
      variantId,
      storeId: row.product.store.id,
      availableQty,
      threshold: lowStockThreshold,
    };

    await this.createAlert(merchantUserId, title, body, data);

    const admins = await this.prisma.user.findMany({
      where: { roles: { some: { role: { name: { in: ['ADMIN', 'SUPER_ADMIN'] } } } } },
      select: { id: true },
      take: 20,
    });

    for (const admin of admins) {
      await this.createAlert(
        admin.id,
        `[${row.product.store.merchantProfile.businessName}] ${title}`,
        body,
        data,
      );
    }

    this.logger.log({ variantId, availableQty, actorUserId }, 'Low stock alert sent');
  }

  private async createAlert(
    userId: string,
    title: string,
    body: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const recent = await this.prisma.notification.findFirst({
      where: {
        userId,
        type: NotificationType.INVENTORY_ALERT,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        body,
      },
    });
    if (recent) return;

    await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.INVENTORY_ALERT,
        title,
        body,
        data: data as Prisma.InputJsonValue,
      },
    });
  }
}
