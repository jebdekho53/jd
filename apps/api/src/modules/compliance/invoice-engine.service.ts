import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GstSlab, GstSupplyType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GstCalculatorService } from './gst-calculator.service';
import { GstPdfService } from './gst-pdf.service';
import { GstEmailService } from './gst-email.service';
import { gstinStateCode, isValidGstin, normalizeGstin } from './gst-validation.util';

interface DeliveryAddress {
  state?: string;
  stateCode?: string;
  city?: string;
  line1?: string;
  pincode?: string;
}

@Injectable()
export class InvoiceEngineService {
  private readonly logger = new Logger(InvoiceEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: GstCalculatorService,
    private readonly pdf: GstPdfService,
    private readonly email: GstEmailService,
  ) {}

  async generateForOrder(orderId: string): Promise<{ invoiceId: string; invoiceNumber: string }> {
    const existing = await this.prisma.gSTInvoice.findUnique({ where: { orderId } });
    if (existing) {
      return { invoiceId: existing.id, invoiceNumber: existing.invoiceNumber };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { include: { hsnCodeRef: true } },
          },
        },
        store: {
          include: {
            merchantProfile: true,
            city: true,
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    const supplierGstin = order.store.merchantProfile.gstNumber;
    if (supplierGstin && !isValidGstin(supplierGstin)) {
      throw new BadRequestException('Merchant GSTIN is invalid');
    }

    const deliveryAddress = order.deliveryAddress as DeliveryAddress;
    const supplierState =
      (supplierGstin ? gstinStateCode(supplierGstin) : null) ??
      mapStateNameToCode(order.store.city?.state) ??
      '27';
    const buyerState = deliveryAddress.stateCode ?? deliveryAddress.state ?? supplierState;
    const supplyType = this.calculator.resolveSupplyType(supplierState, buyerState);
    const placeOfSupply = deliveryAddress.state ?? deliveryAddress.city ?? supplierState;

    const lineBreakdowns: Array<{
      orderItemId: string;
      productName: string;
      hsnCode: string;
      quantity: number;
      unitPrice: number;
      gstSlab: GstSlab;
      breakdown: Awaited<ReturnType<GstCalculatorService['computeLine']>>;
    }> = [];

    for (const item of order.items) {
      const gstSlab =
        item.product.gstSlab ??
        item.product.hsnCodeRef?.defaultGstSlab ??
        GstSlab.EIGHTEEN;
      const rates = await this.calculator.getRatesForSlab(gstSlab);
      const breakdown = this.calculator.computeLine(
        {
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
          gstSlab,
          taxInclusive: item.product.taxInclusive,
        },
        supplyType,
        rates,
      );
      const hsnCode = item.product.hsnCodeRef?.code ?? '9997';
      lineBreakdowns.push({
        orderItemId: item.id,
        productName: `${item.productName}${item.variantName ? ` (${item.variantName})` : ''}`,
        hsnCode,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        gstSlab,
        breakdown,
      });
    }

    const totals = this.calculator.sumLines(lineBreakdowns.map((l) => l.breakdown));
    const subtotal = lineBreakdowns.reduce(
      (s, l) => s + l.quantity * l.unitPrice - Number(order.items.find((i) => i.id === l.orderItemId)?.discount ?? 0),
      0,
    );
    const deliveryFee = Number(order.deliveryFee);
    const grandTotal = totals.grandTotal + deliveryFee;

    const invoiceNumber = await this.nextInvoiceNumber();

    const invoice = await this.prisma.$transaction(async (tx) => {
      const dup = await tx.gSTInvoice.findUnique({ where: { orderId } });
      if (dup) throw new ConflictException('Invoice already exists for this order');

      const inv = await tx.gSTInvoice.create({
        data: {
          invoiceNumber,
          orderId,
          storeId: order.storeId,
          merchantProfileId: order.store.merchantProfileId,
          buyerProfileId: order.buyerProfileId,
          supplyType,
          supplierGstin: supplierGstin ? normalizeGstin(supplierGstin) : null,
          buyerGstin: null,
          supplierState,
          buyerState,
          placeOfSupply,
          subtotal,
          discountAmount: Number(order.discountAmount),
          taxableAmount: totals.taxableAmount,
          cgstAmount: totals.cgstAmount,
          sgstAmount: totals.sgstAmount,
          igstAmount: totals.igstAmount,
          totalTax: totals.totalTax,
          deliveryFee,
          grandTotal,
          isImmutable: true,
          pdfStorageKey: `invoices/${invoiceNumber}.pdf`,
          lines: {
            create: lineBreakdowns.map((l) => ({
              orderItemId: l.orderItemId,
              productName: l.productName,
              hsnCode: l.hsnCode,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              taxableAmount: l.breakdown.taxableAmount,
              gstSlab: l.gstSlab,
              cgstRate: l.breakdown.cgstRate,
              sgstRate: l.breakdown.sgstRate,
              igstRate: l.breakdown.igstRate,
              cgstAmount: l.breakdown.cgstAmount,
              sgstAmount: l.breakdown.sgstAmount,
              igstAmount: l.breakdown.igstAmount,
              lineTotal: l.breakdown.lineTotal,
            })),
          },
        },
        include: { lines: true },
      });

      return inv;
    });

    void this.email.sendInvoiceEmail(invoice.id).catch((err) => {
      this.logger.error({ err, orderId }, 'Invoice email failed');
    });

    this.logger.log({ orderId, invoiceNumber: invoice.invoiceNumber }, 'GST invoice generated');

    return { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber };
  }

  async getInvoicePdf(invoiceId: string): Promise<Buffer> {
    const invoice = await this.prisma.gSTInvoice.findUnique({
      where: { id: invoiceId },
      include: { lines: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    return this.pdf.generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      supplierGstin: invoice.supplierGstin,
      buyerGstin: invoice.buyerGstin,
      supplierState: invoice.supplierState,
      placeOfSupply: invoice.placeOfSupply,
      supplyType: invoice.supplyType === GstSupplyType.INTRA_STATE ? 'Intra-State' : 'Inter-State',
      lines: invoice.lines.map((l) => ({
        productName: l.productName,
        hsnCode: l.hsnCode,
        quantity: l.quantity,
        unitPrice: Number(l.unitPrice),
        taxableAmount: Number(l.taxableAmount),
        cgstAmount: Number(l.cgstAmount),
        sgstAmount: Number(l.sgstAmount),
        igstAmount: Number(l.igstAmount),
        lineTotal: Number(l.lineTotal),
      })),
      totals: {
        subtotal: Number(invoice.subtotal),
        taxableAmount: Number(invoice.taxableAmount),
        cgstAmount: Number(invoice.cgstAmount),
        sgstAmount: Number(invoice.sgstAmount),
        igstAmount: Number(invoice.igstAmount),
        totalTax: Number(invoice.totalTax),
        deliveryFee: Number(invoice.deliveryFee),
        grandTotal: Number(invoice.grandTotal),
      },
    });
  }

  private async nextInvoiceNumber(): Promise<string> {
    const now = new Date();
    const periodKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    const seq = await this.prisma.$transaction(async (tx) => {
      const row = await tx.gstInvoiceSequence.upsert({
        where: { periodKey },
        create: { periodKey, lastSequence: 1 },
        update: { lastSequence: { increment: 1 } },
      });
      return row.lastSequence;
    });

    return `JD-INV-${periodKey}-${String(seq).padStart(6, '0')}`;
  }
}

function mapStateNameToCode(stateName?: string | null): string | null {
  if (!stateName) return null;
  const map: Record<string, string> = {
    Maharashtra: '27',
    Delhi: '07',
    Karnataka: '29',
    'Tamil Nadu': '33',
    Gujarat: '24',
    'Uttar Pradesh': '09',
    'West Bengal': '19',
    Telangana: '36',
  };
  return map[stateName] ?? null;
}
