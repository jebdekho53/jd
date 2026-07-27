import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');

export interface PdfDocumentInput {
  title: string;
  documentNumber: string;
  documentDate: string;
  sections: Array<{ heading?: string; lines: string[] }>;
}

const BRAND = 'JebDekho';
const INK = '#111827';
const MUTED = '#6b7280';
const RULE = '#d1d5db';
const HEADER_FILL = '#f3f4f6';
const PAGE_MARGIN = 40;

@Injectable()
export class GstPdfService {
  async generate(input: PdfDocumentInput): Promise<Buffer> {
    return renderPdf((doc) => {
      drawLetterhead(doc, input.title, input.documentNumber, input.documentDate);

      for (const section of input.sections) {
        if (section.heading) {
          doc.moveDown(0.75);
          doc.fontSize(11).font('Helvetica-Bold').fillColor(INK).text(section.heading);
          doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - PAGE_MARGIN, doc.y + 2).strokeColor(RULE).stroke();
          doc.moveDown(0.5);
        }
        doc.fontSize(9.5).font('Helvetica').fillColor(INK);
        for (const line of section.lines) {
          doc.text(line || ' ');
        }
      }

      drawFooter(doc);
    });
  }

  async generateInvoicePdf(invoice: {
    invoiceNumber: string;
    invoiceDate: Date;
    supplierGstin: string | null;
    buyerGstin: string | null;
    supplierState: string;
    placeOfSupply: string;
    supplyType: string;
    lines: Array<{
      productName: string;
      hsnCode: string;
      quantity: number;
      unitPrice: number;
      taxableAmount: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      lineTotal: number;
    }>;
    totals: {
      subtotal: number;
      taxableAmount: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalTax: number;
      deliveryFee: number;
      grandTotal: number;
    };
  }): Promise<Buffer> {
    return renderPdf((doc) => {
      drawLetterhead(doc, 'Tax Invoice', invoice.invoiceNumber, invoice.invoiceDate.toISOString().slice(0, 10));

      // Parties
      const colWidth = (doc.page.width - PAGE_MARGIN * 2 - 20) / 2;
      const partiesTop = doc.y;
      doc.fontSize(9).font('Helvetica-Bold').fillColor(INK).text('Sold By', PAGE_MARGIN, partiesTop);
      doc
        .font('Helvetica')
        .fillColor(MUTED)
        .text(`GSTIN: ${invoice.supplierGstin ?? 'Unregistered'}`)
        .text(`State: ${invoice.supplierState}`);

      doc.fontSize(9).font('Helvetica-Bold').fillColor(INK).text('Billed To', PAGE_MARGIN + colWidth + 20, partiesTop);
      doc
        .font('Helvetica')
        .fillColor(MUTED)
        .text(`GSTIN: ${invoice.buyerGstin ?? 'B2C (unregistered)'}`)
        .text(`Place of Supply: ${invoice.placeOfSupply}`)
        .text(`Supply Type: ${invoice.supplyType}`);

      doc.moveDown(1);
      doc.moveTo(PAGE_MARGIN, doc.y).lineTo(doc.page.width - PAGE_MARGIN, doc.y).strokeColor(RULE).stroke();
      doc.moveDown(0.75);

      drawLineItemsTable(doc, invoice.lines);

      doc.moveDown(0.5);
      drawTotalsBlock(doc, invoice.totals);

      drawFooter(doc);
    });
  }
}

function renderPdf(draw: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      draw(doc);
    } catch (err) {
      reject(err as Error);
      return;
    }
    doc.end();
  });
}

function drawLetterhead(doc: PDFKit.PDFDocument, title: string, documentNumber: string, documentDate: string): void {
  doc.fontSize(20).font('Helvetica-Bold').fillColor(INK).text(BRAND, PAGE_MARGIN, PAGE_MARGIN);
  doc.fontSize(8.5).font('Helvetica').fillColor(MUTED).text('Hyperlocal commerce platform');

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor(MUTED)
    .text(`Document No: ${documentNumber}`, PAGE_MARGIN, PAGE_MARGIN, {
      width: doc.page.width - PAGE_MARGIN * 2,
      align: 'right',
    })
    .text(`Date: ${documentDate}`, { align: 'right' });

  doc.moveDown(0.5);
  doc.fontSize(15).font('Helvetica-Bold').fillColor(INK).text(title.toUpperCase(), { align: 'center' });
  doc.moveDown(0.75);
  doc.moveTo(PAGE_MARGIN, doc.y).lineTo(doc.page.width - PAGE_MARGIN, doc.y).strokeColor(RULE).stroke();
  doc.moveDown(0.75);
}

interface InvoiceLine {
  productName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  lineTotal: number;
}

const TABLE_COLUMNS: Array<{ label: string; width: number; align?: 'left' | 'right' }> = [
  { label: '#', width: 20 },
  { label: 'Item', width: 130 },
  { label: 'HSN', width: 45 },
  { label: 'Qty', width: 30, align: 'right' },
  { label: 'Rate', width: 45, align: 'right' },
  { label: 'Taxable', width: 55, align: 'right' },
  { label: 'CGST', width: 45, align: 'right' },
  { label: 'SGST', width: 45, align: 'right' },
  { label: 'IGST', width: 45, align: 'right' },
  { label: 'Total', width: 55, align: 'right' },
];

function drawLineItemsTable(doc: PDFKit.PDFDocument, lines: InvoiceLine[]): void {
  const tableX = PAGE_MARGIN;
  const tableWidth = doc.page.width - PAGE_MARGIN * 2;
  const rowHeight = 20;

  const drawHeaderRow = (y: number) => {
    doc.rect(tableX, y, tableWidth, rowHeight).fill(HEADER_FILL);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(INK);
    let x = tableX;
    for (const col of TABLE_COLUMNS) {
      doc.text(col.label, x + 4, y + 6, { width: col.width - 8, align: col.align ?? 'left' });
      x += col.width;
    }
    return y + rowHeight;
  };

  const tableStartY = doc.y;
  let y = drawHeaderRow(tableStartY);

  doc.fontSize(8).font('Helvetica').fillColor(INK);
  for (let i = 0; i < lines.length; i++) {
    if (y + rowHeight > doc.page.height - PAGE_MARGIN - 120) {
      doc.addPage();
      y = drawHeaderRow(PAGE_MARGIN);
    }

    const line = lines[i];
    const cells = [
      String(i + 1),
      line.productName,
      line.hsnCode,
      String(line.quantity),
      line.unitPrice.toFixed(2),
      line.taxableAmount.toFixed(2),
      line.cgstAmount.toFixed(2),
      line.sgstAmount.toFixed(2),
      line.igstAmount.toFixed(2),
      line.lineTotal.toFixed(2),
    ];

    let x = tableX;
    for (let c = 0; c < TABLE_COLUMNS.length; c++) {
      const col = TABLE_COLUMNS[c];
      doc.text(cells[c], x + 4, y + 6, { width: col.width - 8, align: col.align ?? 'left' });
      x += col.width;
    }
    doc.moveTo(tableX, y + rowHeight).lineTo(tableX + tableWidth, y + rowHeight).strokeColor(RULE).stroke();
    y += rowHeight;
  }

  doc.rect(tableX, tableStartY, tableWidth, y - tableStartY).strokeColor(RULE).stroke();
  doc.y = y + 8;
}

function drawTotalsBlock(
  doc: PDFKit.PDFDocument,
  totals: {
    subtotal: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTax: number;
    deliveryFee: number;
    grandTotal: number;
  },
): void {
  const rows: Array<[string, number, boolean?]> = [
    ['Subtotal', totals.subtotal],
    ['Taxable Amount', totals.taxableAmount],
    ['CGST', totals.cgstAmount],
    ['SGST', totals.sgstAmount],
    ['IGST', totals.igstAmount],
    ['Total Tax', totals.totalTax],
    ['Delivery Fee', totals.deliveryFee],
    ['Grand Total', totals.grandTotal, true],
  ];

  const blockWidth = 220;
  const blockX = doc.page.width - PAGE_MARGIN - blockWidth;
  let y = doc.y;

  for (const [label, value, emphasis] of rows) {
    if (emphasis) {
      doc.moveTo(blockX, y).lineTo(blockX + blockWidth, y).strokeColor(RULE).stroke();
      y += 4;
    }
    doc
      .fontSize(emphasis ? 10.5 : 9)
      .font(emphasis ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(INK)
      .text(label, blockX, y, { width: blockWidth * 0.55, align: 'left' })
      .text(`INR ${value.toFixed(2)}`, blockX + blockWidth * 0.55, y, {
        width: blockWidth * 0.45,
        align: 'right',
      });
    y += emphasis ? 18 : 14;
  }

  doc.y = y;
}

function drawFooter(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc
      .fontSize(7.5)
      .font('Helvetica')
      .fillColor(MUTED)
      .text(
        'This is a computer-generated document and does not require a physical signature.',
        PAGE_MARGIN,
        doc.page.height - PAGE_MARGIN - 12,
        { width: doc.page.width - PAGE_MARGIN * 2, align: 'center' },
      );
  }
}
