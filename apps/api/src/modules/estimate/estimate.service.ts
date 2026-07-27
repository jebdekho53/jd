import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GstPdfService } from '../compliance/gst-pdf.service';
import { CreateEstimateDto, UpdateEstimateDto } from './dto/estimate.dto';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class EstimateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdf: GstPdfService,
  ) {}

  async merchantProfileId(userId: string): Promise<string | null> {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return profile?.id ?? null;
  }

  private computeTotals(dto: CreateEstimateDto | UpdateEstimateDto) {
    const lines = dto.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: round2(l.quantity * l.unitPrice),
    }));
    const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
    const taxAmount = round2(dto.taxAmount ?? 0);
    const grandTotal = round2(subtotal + taxAmount);
    return { lines, subtotal, taxAmount, grandTotal };
  }

  private async nextEstimateNumber(): Promise<string> {
    const now = new Date();
    const periodKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.estimate.count({
      where: { estimateNumber: { startsWith: `JD-EST-${periodKey}` } },
    });
    return `JD-EST-${periodKey}-${String(count + 1).padStart(6, '0')}`;
  }

  async create(userId: string, dto: CreateEstimateDto) {
    const merchantProfileId = await this.merchantProfileId(userId);
    if (!merchantProfileId) throw new ForbiddenException('Merchant profile required');

    const { lines, subtotal, taxAmount, grandTotal } = this.computeTotals(dto);
    const estimateNumber = await this.nextEstimateNumber();

    return this.prisma.estimate.create({
      data: {
        merchantProfileId,
        estimateNumber,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        notes: dto.notes,
        subtotal,
        taxAmount,
        grandTotal,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        lines: {
          create: lines.map((l, i) => ({ ...l, sortOrder: i })),
        },
      },
      include: { lines: true },
    });
  }

  async list(userId: string, page: number, limit: number, status?: string) {
    const merchantProfileId = await this.merchantProfileId(userId);
    if (!merchantProfileId) throw new ForbiddenException('Merchant profile required');

    const where = { merchantProfileId, ...(status ? { status: status as never } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.estimate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.estimate.count({ where }),
    ]);

    return {
      items: items.map((e) => ({
        id: e.id,
        estimateNumber: e.estimateNumber,
        customerName: e.customerName,
        status: e.status,
        grandTotal: Number(e.grandTotal),
        validUntil: e.validUntil,
        createdAt: e.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  private async findOwned(userId: string, id: string) {
    const merchantProfileId = await this.merchantProfileId(userId);
    if (!merchantProfileId) throw new ForbiddenException('Merchant profile required');
    const estimate = await this.prisma.estimate.findFirst({
      where: { id, merchantProfileId },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!estimate) throw new NotFoundException('Estimate not found');
    return estimate;
  }

  async getById(userId: string, id: string) {
    const estimate = await this.findOwned(userId, id);
    return {
      id: estimate.id,
      estimateNumber: estimate.estimateNumber,
      customerName: estimate.customerName,
      customerPhone: estimate.customerPhone,
      customerEmail: estimate.customerEmail,
      status: estimate.status,
      notes: estimate.notes,
      subtotal: Number(estimate.subtotal),
      taxAmount: Number(estimate.taxAmount),
      grandTotal: Number(estimate.grandTotal),
      validUntil: estimate.validUntil,
      sentAt: estimate.sentAt,
      respondedAt: estimate.respondedAt,
      createdAt: estimate.createdAt,
      lines: estimate.lines.map((l) => ({
        id: l.id,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        lineTotal: Number(l.lineTotal),
      })),
    };
  }

  async update(userId: string, id: string, dto: UpdateEstimateDto) {
    const estimate = await this.findOwned(userId, id);
    if (estimate.status !== 'DRAFT') {
      throw new BadRequestException('Only draft estimates can be edited');
    }

    const { lines, subtotal, taxAmount, grandTotal } = this.computeTotals(dto);

    await this.prisma.$transaction([
      this.prisma.estimateLine.deleteMany({ where: { estimateId: id } }),
      this.prisma.estimate.update({
        where: { id },
        data: {
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerEmail: dto.customerEmail,
          notes: dto.notes,
          subtotal,
          taxAmount,
          grandTotal,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          lines: { create: lines.map((l, i) => ({ ...l, sortOrder: i })) },
        },
      }),
    ]);

    return this.getById(userId, id);
  }

  async updateStatus(userId: string, id: string, status: 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED') {
    const estimate = await this.findOwned(userId, id);

    const validTransitions: Record<string, string[]> = {
      DRAFT: ['SENT', 'EXPIRED'],
      SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
      ACCEPTED: [],
      REJECTED: ['SENT'],
      EXPIRED: [],
    };
    if (!validTransitions[estimate.status]?.includes(status)) {
      throw new BadRequestException(`Cannot move estimate from ${estimate.status} to ${status}`);
    }

    const data: { status: typeof status; sentAt?: Date; respondedAt?: Date } = { status };
    if (status === 'SENT') data.sentAt = new Date();
    if (status === 'ACCEPTED' || status === 'REJECTED') data.respondedAt = new Date();

    await this.prisma.estimate.update({ where: { id }, data });
    return this.getById(userId, id);
  }

  async getEstimatePdf(userId: string, id: string): Promise<{ buffer: Buffer; estimateNumber: string }> {
    const estimate = await this.findOwned(userId, id);

    const buffer = await this.pdf.generate({
      title: 'Estimate / Quotation',
      documentNumber: estimate.estimateNumber,
      documentDate: estimate.createdAt.toISOString().slice(0, 10),
      sections: [
        {
          heading: 'Customer',
          lines: [
            estimate.customerName,
            estimate.customerPhone ?? '',
            estimate.customerEmail ?? '',
          ].filter(Boolean),
        },
        {
          heading: 'Items',
          lines: estimate.lines.map(
            (l) =>
              `${l.description} | Qty ${Number(l.quantity)} | Rate ${Number(l.unitPrice).toFixed(2)} | Total ${Number(l.lineTotal).toFixed(2)}`,
          ),
        },
        {
          heading: 'Totals',
          lines: [
            `Subtotal: INR ${Number(estimate.subtotal).toFixed(2)}`,
            `Tax: INR ${Number(estimate.taxAmount).toFixed(2)}`,
            `Grand Total: INR ${Number(estimate.grandTotal).toFixed(2)}`,
            estimate.validUntil ? `Valid until: ${estimate.validUntil.toISOString().slice(0, 10)}` : '',
          ].filter(Boolean),
        },
        ...(estimate.notes ? [{ heading: 'Notes', lines: [estimate.notes] }] : []),
      ],
    });

    return { buffer, estimateNumber: estimate.estimateNumber };
  }
}
