import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FulfillmentAuditAction, InventoryTransferStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { CreateTransferDto } from './dto/fulfillment.dto';

@Injectable()
export class InventoryTransferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantDashboard: MerchantDashboardService,
  ) {}

  async createTransfer(userId: string, dto: CreateTransferDto) {
    const ctx = await this.merchantDashboard.resolveStoreContext(userId, dto.fromStoreId);
    if (!ctx.merchantProfileId) throw new ForbiddenException('Merchant profile required');
    if (!ctx.storeIds.includes(dto.fromStoreId) || !ctx.storeIds.includes(dto.toStoreId)) {
      throw new ForbiddenException('Stores must belong to your merchant account');
    }
    if (dto.fromStoreId === dto.toStoreId) {
      throw new BadRequestException('Source and destination must differ');
    }

    const transfer = await this.prisma.inventoryTransfer.create({
      data: {
        merchantProfileId: ctx.merchantProfileId,
        fromStoreId: dto.fromStoreId,
        toStoreId: dto.toStoreId,
        requestedBy: userId,
        notes: dto.notes,
        items: {
          create: dto.items.map((i) => ({ variantId: i.variantId, sku: i.sku, quantity: i.quantity })),
        },
      },
      include: { items: true, fromStore: { select: { name: true } }, toStore: { select: { name: true } } },
    });

    await this.prisma.fulfillmentAudit.create({
      data: {
        storeId: dto.fromStoreId,
        action: FulfillmentAuditAction.TRANSFER_REQUESTED,
        metadata: { transferId: transfer.id } as Prisma.InputJsonValue,
      },
    });

    return transfer;
  }

  async listTransfers(userId: string, storeId?: string) {
    const ctx = await this.merchantDashboard.resolveStoreContext(userId, storeId);
    if (!ctx.merchantProfileId) return [];

    return this.prisma.inventoryTransfer.findMany({
      where: {
        merchantProfileId: ctx.merchantProfileId,
        ...(storeId ? { OR: [{ fromStoreId: storeId }, { toStoreId: storeId }] } : {}),
      },
      include: {
        items: true,
        fromStore: { select: { id: true, name: true, storeType: true } },
        toStore: { select: { id: true, name: true, storeType: true } },
      },
      orderBy: { requestedAt: 'desc' },
      take: 50,
    });
  }

  async approveTransfer(userId: string, transferId: string) {
    const transfer = await this.getOwnedTransfer(userId, transferId);
    if (transfer.status !== InventoryTransferStatus.REQUESTED) {
      throw new BadRequestException('Only REQUESTED transfers can be approved');
    }

    const updated = await this.prisma.inventoryTransfer.update({
      where: { id: transferId },
      data: { status: InventoryTransferStatus.APPROVED, approvedBy: userId, approvedAt: new Date() },
      include: { items: true },
    });

    await this.prisma.fulfillmentAudit.create({
      data: {
        storeId: transfer.fromStoreId,
        action: FulfillmentAuditAction.TRANSFER_APPROVED,
        metadata: { transferId } as Prisma.InputJsonValue,
      },
    });

    return updated;
  }

  async completeTransfer(userId: string, transferId: string) {
    const transfer = await this.getOwnedTransfer(userId, transferId);
    if (
      transfer.status !== InventoryTransferStatus.APPROVED &&
      transfer.status !== InventoryTransferStatus.IN_TRANSIT
    ) {
      throw new BadRequestException('Transfer must be APPROVED or IN_TRANSIT to complete');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        const sourceInv = await tx.inventory.findFirst({
          where: { variantId: item.variantId },
        });
        if (!sourceInv || sourceInv.availableQty < item.quantity) {
          throw new BadRequestException(`Insufficient stock for SKU ${item.sku}`);
        }
        await tx.inventory.update({
          where: { id: sourceInv.id },
          data: { availableQty: { decrement: item.quantity } },
        });

        const destVariant = await tx.productVariant.findFirst({
          where: {
            sku: item.sku,
            product: { storeId: transfer.toStoreId },
            isActive: true,
          },
          include: { inventory: true },
        });
        if (destVariant?.inventory) {
          await tx.inventory.update({
            where: { id: destVariant.inventory.id },
            data: { availableQty: { increment: item.quantity } },
          });
        }
      }

      await tx.inventoryTransfer.update({
        where: { id: transferId },
        data: { status: InventoryTransferStatus.RECEIVED, completedAt: new Date() },
      });
    });

    await this.prisma.fulfillmentAudit.create({
      data: {
        storeId: transfer.toStoreId,
        action: FulfillmentAuditAction.TRANSFER_COMPLETED,
        metadata: { transferId } as Prisma.InputJsonValue,
      },
    });

    return this.prisma.inventoryTransfer.findUnique({
      where: { id: transferId },
      include: { items: true },
    });
  }

  private async getOwnedTransfer(userId: string, transferId: string) {
    const transfer = await this.prisma.inventoryTransfer.findUnique({
      where: { id: transferId },
      include: { items: true },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');

    const ctx = await this.merchantDashboard.resolveStoreContext(userId);
    if (!ctx.merchantProfileId || transfer.merchantProfileId !== ctx.merchantProfileId) {
      throw new ForbiddenException('Transfer not found');
    }
    return transfer;
  }
}
