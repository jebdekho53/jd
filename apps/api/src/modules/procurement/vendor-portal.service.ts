import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  VendorInvoiceStatus,
  VendorOrderStatus,
  VendorShipmentStatus,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { CreateVendorProductDto, ShipVendorOrderDto } from './dto/procurement.dto';

@Injectable()
export class VendorPortalService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveVendorId(userId: string): Promise<string> {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('Vendor profile required');
    return profile.vendorId;
  }

  async listOrders(userId: string) {
    const vendorId = await this.resolveVendorId(userId);
    return this.prisma.vendorOrder.findMany({
      where: { vendorId },
      include: { items: true, shipment: true, invoice: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async shipOrder(userId: string, orderId: string, dto: ShipVendorOrderDto) {
    const vendorId = await this.resolveVendorId(userId);
    const order = await this.prisma.vendorOrder.findFirst({ where: { id: orderId, vendorId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== VendorOrderStatus.CONFIRMED && order.status !== VendorOrderStatus.PENDING) {
      throw new BadRequestException('Order cannot be shipped in current status');
    }

    await this.prisma.$transaction([
      this.prisma.vendorOrder.update({
        where: { id: orderId },
        data: { status: VendorOrderStatus.SHIPPED },
      }),
      this.prisma.vendorShipment.upsert({
        where: { vendorOrderId: orderId },
        create: {
          vendorOrderId: orderId,
          status: VendorShipmentStatus.IN_TRANSIT,
          carrier: dto.carrier,
          trackingNumber: dto.trackingNumber,
          shippedAt: new Date(),
        },
        update: {
          status: VendorShipmentStatus.IN_TRANSIT,
          carrier: dto.carrier,
          trackingNumber: dto.trackingNumber,
          shippedAt: new Date(),
        },
      }),
    ]);

    return this.prisma.vendorOrder.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });
  }

  async deliverOrder(userId: string, orderId: string) {
    const vendorId = await this.resolveVendorId(userId);
    const order = await this.prisma.vendorOrder.findFirst({ where: { id: orderId, vendorId } });
    if (!order) throw new NotFoundException('Order not found');

    const invoiceNumber = `VI-${randomBytes(4).toString('hex').toUpperCase()}`;
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.vendorOrder.update({
        where: { id: orderId },
        data: { status: VendorOrderStatus.DELIVERED },
      });
      await tx.vendorShipment.update({
        where: { vendorOrderId: orderId },
        data: { status: VendorShipmentStatus.DELIVERED, deliveredAt: new Date() },
      });
      await tx.vendorInvoice.upsert({
        where: { vendorOrderId: orderId },
        create: {
          vendorOrderId: orderId,
          invoiceNumber,
          status: VendorInvoiceStatus.ISSUED,
          subtotal: order.subtotal,
          taxAmount: order.taxAmount,
          totalAmount: order.totalAmount,
          dueDate,
        },
        update: { status: VendorInvoiceStatus.ISSUED },
      });
      for (const item of await tx.vendorOrderItem.findMany({ where: { vendorOrderId: orderId } })) {
        await tx.vendorInventory.updateMany({
          where: { vendorProductId: item.vendorProductId },
          data: {
            reservedQty: { decrement: item.quantity },
            availableQty: { decrement: item.quantity },
          },
        });
      }
    });

    return this.prisma.vendorOrder.findUnique({
      where: { id: orderId },
      include: { invoice: true, shipment: true },
    });
  }

  async getCatalog(userId: string) {
    const vendorId = await this.resolveVendorId(userId);
    return this.prisma.vendorCatalog.findMany({
      where: { vendorId },
      include: {
        products: {
          include: { inventory: true, priceTiers: true },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async createProduct(userId: string, dto: CreateVendorProductDto) {
    const vendorId = await this.resolveVendorId(userId);
    const catalog = await this.prisma.vendorCatalog.findFirst({
      where: { id: dto.catalogId, vendorId },
    });
    if (!catalog) throw new NotFoundException('Catalog not found');

    const product = await this.prisma.vendorProduct.create({
      data: {
        vendorId,
        catalogId: dto.catalogId,
        name: dto.name,
        sku: dto.sku,
        description: dto.description,
        category: dto.category,
        hsnCode: dto.hsnCode,
        gstRate: dto.gstRate ?? 0,
        basePrice: dto.basePrice,
        moq: dto.moq ?? 1,
        leadTimeDays: dto.leadTimeDays ?? 3,
        inventory: {
          create: { availableQty: dto.availableQty ?? 0 },
        },
      },
      include: { inventory: true },
    });
    return product;
  }
}
