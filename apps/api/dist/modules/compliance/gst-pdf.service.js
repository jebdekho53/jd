"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GstPdfService = void 0;
const common_1 = require("@nestjs/common");
let GstPdfService = class GstPdfService {
    generate(input) {
        const textLines = [
            'JebDekho — GST Compliance Document',
            input.title,
            `Document: ${input.documentNumber}`,
            `Date: ${input.documentDate}`,
            '',
        ];
        for (const section of input.sections) {
            if (section.heading) {
                textLines.push(section.heading);
                textLines.push('-'.repeat(Math.min(60, section.heading.length)));
            }
            textLines.push(...section.lines);
            textLines.push('');
        }
        textLines.push('This is a computer-generated document for audit purposes.');
        return buildMinimalPdf(textLines);
    }
    generateInvoicePdf(invoice) {
        const lineRows = invoice.lines.map((l) => `${l.productName} | HSN ${l.hsnCode} | Qty ${l.quantity} @ ${l.unitPrice.toFixed(2)} | Taxable ${l.taxableAmount.toFixed(2)} | CGST ${l.cgstAmount.toFixed(2)} | SGST ${l.sgstAmount.toFixed(2)} | IGST ${l.igstAmount.toFixed(2)} | Total ${l.lineTotal.toFixed(2)}`);
        return this.generate({
            title: 'Tax Invoice',
            documentNumber: invoice.invoiceNumber,
            documentDate: invoice.invoiceDate.toISOString().slice(0, 10),
            sections: [
                {
                    heading: 'Parties',
                    lines: [
                        `Supplier GSTIN: ${invoice.supplierGstin ?? 'Unregistered'}`,
                        `Buyer GSTIN: ${invoice.buyerGstin ?? 'B2C'}`,
                        `Supplier State: ${invoice.supplierState}`,
                        `Place of Supply: ${invoice.placeOfSupply}`,
                        `Supply Type: ${invoice.supplyType}`,
                    ],
                },
                { heading: 'Line Items', lines: lineRows },
                {
                    heading: 'Summary',
                    lines: [
                        `Subtotal: INR ${invoice.totals.subtotal.toFixed(2)}`,
                        `Taxable Amount: INR ${invoice.totals.taxableAmount.toFixed(2)}`,
                        `CGST: INR ${invoice.totals.cgstAmount.toFixed(2)}`,
                        `SGST: INR ${invoice.totals.sgstAmount.toFixed(2)}`,
                        `IGST: INR ${invoice.totals.igstAmount.toFixed(2)}`,
                        `Total Tax: INR ${invoice.totals.totalTax.toFixed(2)}`,
                        `Delivery Fee: INR ${invoice.totals.deliveryFee.toFixed(2)}`,
                        `Grand Total: INR ${invoice.totals.grandTotal.toFixed(2)}`,
                    ],
                },
            ],
        });
    }
};
exports.GstPdfService = GstPdfService;
exports.GstPdfService = GstPdfService = __decorate([
    (0, common_1.Injectable)()
], GstPdfService);
function buildMinimalPdf(lines) {
    const content = lines
        .map((line, i) => {
        const y = 750 - i * 14;
        const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        return `BT /F1 10 Tf 50 ${y} Td (${escaped}) Tj ET`;
    })
        .join('\n');
    const stream = `${content}\n`;
    const streamLen = Buffer.byteLength(stream, 'utf8');
    const objects = [
        '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj',
        '2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj',
        '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj',
        `4 0 obj<< /Length ${streamLen} >>stream\n${stream}endstream\nendobj`,
        '5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj',
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const obj of objects) {
        offsets.push(Buffer.byteLength(pdf, 'utf8'));
        pdf += `${obj}\n`;
    }
    const xrefPos = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i++) {
        pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${xrefPos}\n%%EOF`;
    return Buffer.from(pdf, 'utf8');
}
//# sourceMappingURL=gst-pdf.service.js.map