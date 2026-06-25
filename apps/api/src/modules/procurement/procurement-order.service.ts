import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  VendorInvoiceStatus,
  VendorOrderStatus,
  VendorShipmentStatus,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { CreateVendorOrderDto } from './dto/procurement.dto';
import { ProcurementCartService } from './procurement-cart.service';

function generateVendorOrderNumber(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `VP-${ymd}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

@Injectable()
export class ProcurementOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: ProcurementCartService,
  ) {}

  async createOrder(userId: string, dto: CreateVendorOrderDto) {
    const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('Merchant profile required');

    const cart = await this.cartService.getCart(userId, dto.storeId);
    if (cart.items.length === 0) throw new BadRequestException('Procurement cart is empty');

    const vendorIds = new Set(cart.items.map((i) => i.vendorProduct.vendorId));
    if (vendorIds.size > 1) throw new BadRequestException('Cart must contain items from one vendor');

    const vendorId = cart.items[0].vendorProduct.vendorId;
    let subtotal = 0;
    let taxAmount = 0;

    for (const item of cart.items) {
      const line = Number(item.unitPrice) * item.quantity;
      subtotal += line;
      taxAmount += line * (item.vendorProduct.gstRate / 100);
    }
    const totalAmount = subtotal + taxAmount;

    let creditUsed = 0;
    if (dto.useCredit) {
      const credit = await this.prisma.vendorCreditLine.findUnique({
        where: { vendorId_merchantProfileId: { vendorId, merchantProfileId: profile.id } },
      });
      if (credit && credit.isActive) {
        const available = Number(credit.creditLimit) - Number(credit.usedLimit);
        creditUsed = Math.min(available, totalAmount);
      }
    }

    const order = await this.prisma.$transaction(async (tx) => {
      let orderNumber: string;
      let attempts = 0;
      do {
        orderNumber = generateVendorOrderNumber();
        attempts++;
      } while ((await tx.vendorOrder.findUnique({ where: { orderNumber } })) && attempts < 5);

      const created = await tx.vendorOrder.create({
        data: {
          orderNumber,
          merchantProfileId: profile.id,
          storeId: dto.storeId,
          vendorId,
          status: VendorOrderStatus.PENDING,
          subtotal,
          taxAmount,
          totalAmount,
          creditUsed,
          notes: dto.notes,
          items: {
            create: cart.items.map((i) => ({
              vendorProductId: i.vendorProductId,
              sku: i.vendorProduct.sku,
              productName: i.vendorProduct.name,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: Number(i.unitPrice) * i.quantity,
            })),
          },
        },
        include: { items: true, vendor: true },
      });

      if (creditUsed > 0) {
        await tx.vendorCreditLine.update({
          where: { vendorId_merchantProfileId: { vendorId, merchantProfileId: profile.id } },
          data: { usedLimit: { increment: creditUsed } },
        });
      }

      for (const item of cart.items) {
        await tx.vendorInventory.updateMany({
          where: { vendorProductId: item.vendorProductId },
          data: { reservedQty: { increment: item.quantity } },
        });
      }

      await tx.procurementCartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    return order;
  }

  async listOrders(userId: string, storeId?: string) {
    const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (!profile) return [];

    return this.prisma.vendorOrder.findMany({
      where: { merchantProfileId: profile.id, ...(storeId ? { storeId } : {}) },
      include: {
        vendor: { select: { businessName: true, vendorType: true } },
        shipment: true,
        invoice: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
