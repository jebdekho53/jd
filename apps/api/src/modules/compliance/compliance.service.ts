import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceCacheService } from './compliance-cache.service';
import { TdsTcsService } from './tds-tcs.service';

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: ComplianceCacheService,
    private readonly tdsTcs: TdsTcsService,
  ) {}

  async getOverview() {
    const cached = await this.cache.get<unknown>('admin:overview');
    if (cached) return cached;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [invoiceAgg, creditCount, debitCount, tcs] = await Promise.all([
      this.prisma.gSTInvoice.aggregate({
        where: { invoiceDate: { gte: monthStart } },
        _sum: { totalTax: true, taxableAmount: true, grandTotal: true },
        _count: true,
      }),
      this.prisma.creditNote.count({ where: { issuedAt: { gte: monthStart } } }),
      this.prisma.debitNote.count({ where: { issuedAt: { gte: monthStart } } }),
      this.tdsTcs.platformTcsSummary(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`),
    ]);

    const data = {
      monthToDate: {
        invoices: invoiceAgg._count,
        taxableSales: Number(invoiceAgg._sum.taxableAmount ?? 0),
        gstCollected: Number(invoiceAgg._sum.totalTax ?? 0),
        gmv: Number(invoiceAgg._sum.grandTotal ?? 0),
        creditNotes: creditCount,
        debitNotes: debitCount,
        platformTcs: tcs.totalTcs,
      },
    };

    void this.cache.set('admin:overview', data, 120);
    return data;
  }

  async listInvoices(page = 1, limit = 20, month?: string) {
    const where: Prisma.GSTInvoiceWhereInput = {};
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.invoiceDate = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }

    const [items, total] = await Promise.all([
      this.prisma.gSTInvoice.findMany({
        where,
        orderBy: { invoiceDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { store: { select: { name: true } } },
      }),
      this.prisma.gSTInvoice.count({ where }),
    ]);

    return {
      items: items.map((i) => this.mapInvoice(i)),
      total,
      page,
      limit,
    };
  }

  async listCreditNotes(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.creditNote.findMany({
        orderBy: { issuedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { invoice: { select: { invoiceNumber: true } } },
      }),
      this.prisma.creditNote.count(),
    ]);
    return { items, total, page, limit };
  }

  async listDebitNotes(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.debitNote.findMany({
        orderBy: { issuedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { merchantProfile: { select: { businessName: true } } },
      }),
      this.prisma.debitNote.count(),
    ]);
    return { items, total, page, limit };
  }

  async getInvoiceDetail(invoiceId: string) {
    const invoice = await this.prisma.gSTInvoice.findUnique({
      where: { id: invoiceId },
      include: { lines: true, store: { select: { name: true } }, order: { select: { orderNumber: true } } },
    });
    if (!invoice) return null;
    return this.mapInvoice(invoice);
  }

  async merchantGstDashboard(merchantProfileId: string, month?: string) {
    const where: Prisma.GSTInvoiceWhereInput = { merchantProfileId };
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.invoiceDate = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }

    const agg = await this.prisma.gSTInvoice.aggregate({
      where,
      _sum: { taxableAmount: true, totalTax: true, grandTotal: true },
      _count: true,
    });

    const recent = await this.prisma.gSTInvoice.findMany({
      where: { merchantProfileId },
      orderBy: { invoiceDate: 'desc' },
      take: 10,
      include: { order: { select: { orderNumber: true } } },
    });

    const tds = await this.tdsTcs.merchantTdsSummary(merchantProfileId, month);

    return {
      summary: {
        invoiceCount: agg._count,
        taxableSales: Number(agg._sum.taxableAmount ?? 0),
        gstCollected: Number(agg._sum.totalTax ?? 0),
        grossTotal: Number(agg._sum.grandTotal ?? 0),
      },
      recentInvoices: recent.map((i) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        orderNumber: i.order.orderNumber,
        grandTotal: Number(i.grandTotal),
        invoiceDate: i.invoiceDate,
      })),
      tds,
    };
  }

  async buyerInvoiceForOrder(orderId: string, buyerProfileId: string) {
    const invoice = await this.prisma.gSTInvoice.findFirst({
      where: { orderId, buyerProfileId },
      include: { lines: true, order: { select: { orderNumber: true, status: true } } },
    });
    if (!invoice) return null;
    return {
      ...this.mapInvoice(invoice),
      orderNumber: invoice.order.orderNumber,
      orderStatus: invoice.order.status,
      lines: invoice.lines,
    };
  }

  private mapInvoice(i: {
    id: string;
    invoiceNumber: string;
    orderId: string;
    status: string;
    supplyType: string;
    supplierGstin: string | null;
    taxableAmount: unknown;
    cgstAmount: unknown;
    sgstAmount: unknown;
    igstAmount: unknown;
    totalTax: unknown;
    grandTotal: unknown;
    deliveryFee: unknown;
    invoiceDate: Date;
    emailedAt: Date | null;
    isImmutable: boolean;
    store?: { name: string };
    order?: { orderNumber: string };
  }) {
    return {
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      orderId: i.orderId,
      orderNumber: i.order?.orderNumber,
      storeName: i.store?.name,
      status: i.status,
      supplyType: i.supplyType,
      supplierGstin: i.supplierGstin,
      taxableAmount: Number(i.taxableAmount),
      cgstAmount: Number(i.cgstAmount),
      sgstAmount: Number(i.sgstAmount),
      igstAmount: Number(i.igstAmount),
      totalTax: Number(i.totalTax),
      grandTotal: Number(i.grandTotal),
      deliveryFee: Number(i.deliveryFee),
      invoiceDate: i.invoiceDate,
      emailedAt: i.emailedAt,
      isImmutable: i.isImmutable,
    };
  }
}
