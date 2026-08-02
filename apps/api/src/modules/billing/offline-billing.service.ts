import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DomainEventType, GstSlab, GstSupplyType, OfflineBill, OfflineBillItem } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { InventoryService } from '../inventory/inventory.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { GstPdfService } from '../compliance/gst-pdf.service';
import { GstCalculatorService } from '../compliance/gst-calculator.service';
import { CreateOfflineBillDto, ListOfflineBillsDto } from './dto/offline-bill.dto';

@Injectable()
export class OfflineBillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
    private readonly inventoryService: InventoryService,
    private readonly domainEvents: DomainEventsService,
    private readonly pdf: GstPdfService,
    private readonly gstCalculator: GstCalculatorService,
  ) {}

  private async assertStore(userId: string, storeId: string) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async createBill(userId: string, storeId: string, dto: CreateOfflineBillDto, ipAddress?: string) {
    await this.assertStore(userId, storeId);

    const variantIds = dto.items.map((i) => i.variantId);
    const uniqueVariantIds = new Set(variantIds);
    if (uniqueVariantIds.size !== variantIds.length) {
      throw new BadRequestException('Duplicate item in bill — combine quantities into a single line');
    }

    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds }, product: { storeId, deletedAt: null } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            gstSlab: true,
            taxInclusive: true,
            hsnCodeRef: { select: { code: true, defaultGstSlab: true } },
          },
        },
      },
    });
    if (variants.length !== uniqueVariantIds.size) {
      throw new BadRequestException('One or more items do not belong to this store');
    }
    const variantById = new Map(variants.map((v) => [v.id, v]));

    // Stock is decremented per line, reusing the same tested, oversell-safe path as
    // the single-item quick action, BEFORE the bill row is persisted — so we never
    // end up with a bill that claims a decrement which didn't actually happen.
    let totalAmount = 0;
    let totalShortfall = 0;
    const lineData: Array<{
      productId: string;
      variantId: string;
      productName: string;
      variantName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      shortfall: number;
      hsnCode: string;
      taxableAmount: number;
      gstAmount: number;
    }> = [];

    for (const item of dto.items) {
      const variant = variantById.get(item.variantId)!;
      const result = await this.inventoryService.recordOfflineSale(
        item.variantId,
        item.quantity,
        userId,
        dto.note,
        { ipAddress },
      );

      const unitPrice = Number(variant.price);
      const lineTotal = unitPrice * item.quantity;
      totalAmount += lineTotal;
      totalShortfall += result.shortfall;

      // In-store sale, so supply is always intra-state — the merchant and the
      // walk-in customer are physically in the same place.
      const gstSlab = variant.product.gstSlab ?? variant.product.hsnCodeRef?.defaultGstSlab ?? GstSlab.EIGHTEEN;
      const hsnCode = variant.product.hsnCodeRef?.code ?? '9997';
      const rates = await this.gstCalculator.getRatesForSlab(gstSlab);
      const breakdown = this.gstCalculator.computeLine(
        { quantity: item.quantity, unitPrice, gstSlab, taxInclusive: variant.product.taxInclusive },
        GstSupplyType.INTRA_STATE,
        rates,
      );

      lineData.push({
        productId: variant.productId,
        variantId: variant.id,
        productName: variant.product.name,
        variantName: variant.name,
        sku: variant.sku,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        shortfall: result.shortfall,
        hsnCode,
        taxableAmount: breakdown.taxableAmount,
        gstAmount: breakdown.cgstAmount + breakdown.sgstAmount,
      });

      await this.domainEvents.emit(
        DomainEventType.INVENTORY_CHANGED,
        'inventory',
        variant.id,
        {
          productId: variant.productId,
          variantId: variant.id,
          storeId,
          newQty: result.availableQty,
          isLowStock: result.availableQty <= 0,
        },
        { userId, ipAddress: ipAddress ?? null },
      );
    }

    const bill = await this.prisma.offlineBill.create({
      data: {
        storeId,
        customerPhone: dto.customerPhone,
        customerName: dto.customerName,
        note: dto.note,
        totalAmount,
        createdById: userId,
        items: { create: lineData },
      },
      include: { items: true },
    });

    return { ...bill, shortfallTotal: totalShortfall };
  }

  async listBills(userId: string, storeId: string, dto: ListOfflineBillsDto) {
    await this.assertStore(userId, storeId);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const where = {
      storeId,
      ...(dto.customerPhone ? { customerPhone: dto.customerPhone } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.offlineBill.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.offlineBill.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getBill(userId: string, storeId: string, billId: string) {
    await this.assertStore(userId, storeId);
    const bill = await this.prisma.offlineBill.findFirst({
      where: { id: billId, storeId },
      include: { items: true },
    });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  /**
   * Distinct walk-in customers captured via offline bills — the local-customer
   * list the merchant can use for future ads targeting. Read-only: no linkage
   * to BuyerProfile/marketing systems yet, phone numbers are just stored.
   */
  async listCustomers(userId: string, storeId: string) {
    await this.assertStore(userId, storeId);
    const bills = await this.prisma.offlineBill.findMany({
      where: { storeId },
      select: { customerPhone: true, customerName: true, totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const byPhone = new Map<
      string,
      { customerPhone: string; customerName: string | null; billCount: number; totalSpent: number; lastBillAt: Date }
    >();
    for (const bill of bills) {
      const existing = byPhone.get(bill.customerPhone);
      if (existing) {
        existing.billCount += 1;
        existing.totalSpent += Number(bill.totalAmount);
        if (bill.createdAt > existing.lastBillAt) {
          existing.lastBillAt = bill.createdAt;
          if (bill.customerName) existing.customerName = bill.customerName;
        }
      } else {
        byPhone.set(bill.customerPhone, {
          customerPhone: bill.customerPhone,
          customerName: bill.customerName,
          billCount: 1,
          totalSpent: Number(bill.totalAmount),
          lastBillAt: bill.createdAt,
        });
      }
    }

    return Array.from(byPhone.values()).sort((a, b) => b.lastBillAt.getTime() - a.lastBillAt.getTime());
  }

  async getBillPdf(userId: string, storeId: string, billId: string): Promise<Buffer> {
    await this.assertStore(userId, storeId);
    const bill = await this.prisma.offlineBill.findFirst({
      where: { id: billId, storeId },
      include: { items: true, store: { select: { name: true, phone: true, line1: true, line2: true } } },
    });
    if (!bill) throw new NotFoundException('Bill not found');
    return this.renderBillPdf(bill);
  }

  async getBillPdfByShareToken(shareToken: string): Promise<{ pdf: Buffer; bill: OfflineBill }> {
    const bill = await this.prisma.offlineBill.findUnique({
      where: { shareToken },
      include: { items: true, store: { select: { name: true, phone: true, line1: true, line2: true } } },
    });
    if (!bill) throw new NotFoundException('Bill not found');
    return { pdf: await this.renderBillPdf(bill), bill };
  }

  private async renderBillPdf(
    bill: OfflineBill & {
      items: OfflineBillItem[];
      store: { name: string; phone: string | null; line1: string; line2: string | null };
    },
  ): Promise<Buffer> {
    const addressLine = [bill.store.line1, bill.store.line2].filter(Boolean).join(', ');
    const itemLines = bill.items.map(
      (item) =>
        `${item.productName} (${item.variantName}) HSN ${item.hsnCode ?? '-'} x ${item.quantity} @ INR ${Number(item.unitPrice).toFixed(2)}` +
        `  =  INR ${Number(item.lineTotal).toFixed(2)} (incl. GST INR ${Number(item.gstAmount).toFixed(2)})` +
        (item.shortfall > 0 ? `   [${item.shortfall} unit(s) beyond tracked stock]` : ''),
    );
    const totalGst = bill.items.reduce((sum, item) => sum + Number(item.gstAmount), 0);
    const totalTaxable = bill.items.reduce((sum, item) => sum + Number(item.taxableAmount), 0);

    return this.pdf.generate({
      title: 'Bill / Receipt',
      documentNumber: bill.id,
      documentDate: bill.createdAt.toLocaleDateString('en-IN'),
      sections: [
        {
          heading: bill.store.name,
          lines: [addressLine, bill.store.phone ? `Phone: ${bill.store.phone}` : ''].filter(Boolean),
        },
        {
          heading: 'Billed to',
          lines: [
            bill.customerName ? `${bill.customerName} (${bill.customerPhone})` : bill.customerPhone,
          ],
        },
        {
          heading: 'Items',
          lines: itemLines,
        },
        {
          heading: 'Total',
          lines: [
            `Taxable amount: INR ${totalTaxable.toFixed(2)}`,
            `GST (CGST+SGST): INR ${totalGst.toFixed(2)}`,
            `Grand Total: INR ${Number(bill.totalAmount).toFixed(2)}`,
            ...(bill.note ? [`Note: ${bill.note}`] : []),
          ],
        },
      ],
    });
  }
}
