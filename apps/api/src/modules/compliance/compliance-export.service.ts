import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GstPdfService } from './gst-pdf.service';

export type ComplianceExportFormat = 'csv' | 'pdf';

@Injectable()
export class ComplianceExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdf: GstPdfService,
  ) {}

  async invoiceRegister(month?: string, format: ComplianceExportFormat = 'csv') {
    const where = month ? this.monthFilter(month) : {};
    const invoices = await this.prisma.gSTInvoice.findMany({
      where,
      orderBy: { invoiceDate: 'asc' },
      include: { store: { select: { name: true } } },
    });

    const rows = [
      ['invoiceNumber', 'invoiceDate', 'store', 'taxableAmount', 'cgst', 'sgst', 'igst', 'totalTax', 'grandTotal'],
      ...invoices.map((i) => [
        i.invoiceNumber,
        i.invoiceDate.toISOString().slice(0, 10),
        i.store.name,
        Number(i.taxableAmount),
        Number(i.cgstAmount),
        Number(i.sgstAmount),
        Number(i.igstAmount),
        Number(i.totalTax),
        Number(i.grandTotal),
      ]),
    ];

    return this.export('invoice-register', rows, format);
  }

  async creditNoteRegister(month?: string, format: ComplianceExportFormat = 'csv') {
    const where: Prisma.CreditNoteWhereInput = {};
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.issuedAt = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }

    const notes = await this.prisma.creditNote.findMany({
      where,
      orderBy: { issuedAt: 'asc' },
    });

    const rows = [
      ['creditNoteNumber', 'issuedAt', 'orderId', 'taxableAmount', 'totalTax', 'grandTotal', 'isPartial'],
      ...notes.map((n) => [
        n.creditNoteNumber,
        n.issuedAt.toISOString().slice(0, 10),
        n.orderId,
        Number(n.taxableAmount),
        Number(n.totalTax),
        Number(n.grandTotal),
        n.isPartial,
      ]),
    ];

    return this.export('credit-note-register', rows, format);
  }

  async monthlyGstSummary(month: string, format: ComplianceExportFormat = 'csv') {
    const [y, m] = month.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    const agg = await this.prisma.gSTInvoice.aggregate({
      where: { invoiceDate: { gte: start, lt: end } },
      _sum: {
        taxableAmount: true,
        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,
        totalTax: true,
        grandTotal: true,
      },
      _count: true,
    });

    const rows = [
      ['metric', 'value'],
      ['period', month],
      ['invoiceCount', agg._count],
      ['taxableAmount', Number(agg._sum.taxableAmount ?? 0)],
      ['cgst', Number(agg._sum.cgstAmount ?? 0)],
      ['sgst', Number(agg._sum.sgstAmount ?? 0)],
      ['igst', Number(agg._sum.igstAmount ?? 0)],
      ['totalTax', Number(agg._sum.totalTax ?? 0)],
      ['grandTotal', Number(agg._sum.grandTotal ?? 0)],
    ];

    return this.export(`gst-summary-${month}`, rows, format);
  }

  async merchantGstSummary(merchantProfileId: string, month?: string, format: ComplianceExportFormat = 'csv') {
    const where: Prisma.GSTInvoiceWhereInput = { merchantProfileId };
    if (month) Object.assign(where, this.monthFilter(month));

    const agg = await this.prisma.gSTInvoice.aggregate({
      where,
      _sum: {
        taxableAmount: true,
        totalTax: true,
        grandTotal: true,
      },
      _count: true,
    });

    const rows = [
      ['metric', 'value'],
      ['merchantProfileId', merchantProfileId],
      ['period', month ?? 'all'],
      ['invoiceCount', agg._count],
      ['taxableSales', Number(agg._sum.taxableAmount ?? 0)],
      ['gstCollected', Number(agg._sum.totalTax ?? 0)],
      ['grossTotal', Number(agg._sum.grandTotal ?? 0)],
    ];

    return this.export('merchant-gst-summary', rows, format);
  }

  async taxLiabilityReport(month: string, format: ComplianceExportFormat = 'csv') {
    const summary = await this.monthlyGstSummary(month, 'csv');
    const creditNotes = await this.creditNoteRegister(month, 'csv');

    const cnLines = creditNotes.content.split('\n').slice(1);
    let creditedTax = 0;
    for (const line of cnLines) {
      const cols = parseCsvLine(line);
      if (cols[4]) creditedTax += Number(cols[4]);
    }

    const summaryMap = Object.fromEntries(
      summary.content
        .split('\n')
        .slice(1)
        .map((l) => {
          const [k, v] = parseCsvLine(l);
          return [k, v];
        }),
    );

    const netTax = Number(summaryMap.totalTax ?? 0) - creditedTax;

    const rows = [
      ['metric', 'value'],
      ['period', month],
      ['outputTax', summaryMap.totalTax ?? 0],
      ['creditNoteTax', creditedTax],
      ['netTaxLiability', netTax],
    ];

    return this.export(`tax-liability-${month}`, rows, format);
  }

  private monthFilter(month: string): Prisma.GSTInvoiceWhereInput {
    const [y, m] = month.split('-').map(Number);
    return { invoiceDate: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) } };
  }

  private export(name: string, rows: (string | number | boolean)[][], format: ComplianceExportFormat) {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    if (format === 'csv') {
      return { content: csv, mime: 'text/csv', filename: `${name}.csv` };
    }
    const pdfBuf = this.pdf.generate({
      title: name.replace(/-/g, ' '),
      documentNumber: name,
      documentDate: new Date().toISOString().slice(0, 10),
      sections: [{ lines: csv.split('\n') }],
    });
    return { content: pdfBuf.toString('base64'), mime: 'application/pdf', filename: `${name}.pdf`, binary: true };
  }
}

function parseCsvLine(line: string): string[] {
  return line.split(',').map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
}
