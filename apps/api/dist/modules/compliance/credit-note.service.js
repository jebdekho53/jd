"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CreditNoteService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditNoteService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const gst_pdf_service_1 = require("./gst-pdf.service");
const gst_email_service_1 = require("./gst-email.service");
let CreditNoteService = CreditNoteService_1 = class CreditNoteService {
    constructor(prisma, pdf, email) {
        this.prisma = prisma;
        this.pdf = pdf;
        this.email = email;
        this.logger = new common_1.Logger(CreditNoteService_1.name);
    }
    async createForRefund(orderId, reason, partialLines) {
        const invoice = await this.prisma.gSTInvoice.findUnique({
            where: { orderId },
            include: { lines: true },
        });
        if (!invoice) {
            this.logger.warn({ orderId }, 'No GST invoice for refund — skipping credit note');
            return { creditNoteId: '', creditNoteNumber: '' };
        }
        const isPartial = Boolean(partialLines?.length);
        const linesToCredit = isPartial
            ? invoice.lines.filter((l) => partialLines.some((p) => p.orderItemId === l.orderItemId))
            : invoice.lines;
        if (!linesToCredit.length) {
            throw new common_1.NotFoundException('No invoice lines to credit');
        }
        const ratioMap = new Map();
        if (isPartial) {
            for (const p of partialLines) {
                const invLine = invoice.lines.find((l) => l.orderItemId === p.orderItemId);
                if (invLine) {
                    ratioMap.set(invLine.id, Math.min(1, p.quantity / invLine.quantity));
                }
            }
        }
        let taxableAmount = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;
        let grandTotal = 0;
        const cnLines = linesToCredit.map((l) => {
            const ratio = isPartial ? (ratioMap.get(l.id) ?? 1) : 1;
            const qty = isPartial ? Math.round(l.quantity * ratio) : l.quantity;
            const lineTaxable = Number(l.taxableAmount) * ratio;
            const lineCgst = Number(l.cgstAmount) * ratio;
            const lineSgst = Number(l.sgstAmount) * ratio;
            const lineIgst = Number(l.igstAmount) * ratio;
            const lineTotal = Number(l.lineTotal) * ratio;
            taxableAmount += lineTaxable;
            cgstAmount += lineCgst;
            sgstAmount += lineSgst;
            igstAmount += lineIgst;
            grandTotal += lineTotal;
            return {
                productName: l.productName,
                hsnCode: l.hsnCode,
                quantity: qty,
                taxableAmount: round2(lineTaxable),
                cgstAmount: round2(lineCgst),
                sgstAmount: round2(lineSgst),
                igstAmount: round2(lineIgst),
                lineTotal: round2(lineTotal),
            };
        });
        taxableAmount = round2(taxableAmount);
        cgstAmount = round2(cgstAmount);
        sgstAmount = round2(sgstAmount);
        igstAmount = round2(igstAmount);
        const totalTax = round2(cgstAmount + sgstAmount + igstAmount);
        grandTotal = round2(grandTotal);
        const creditNoteNumber = await this.nextCreditNoteNumber();
        const note = await this.prisma.creditNote.create({
            data: {
                creditNoteNumber,
                invoiceId: invoice.id,
                orderId,
                reason,
                taxableAmount,
                cgstAmount,
                sgstAmount,
                igstAmount,
                totalTax,
                grandTotal,
                isPartial,
                pdfStorageKey: `credit-notes/${creditNoteNumber}.pdf`,
                lines: { create: cnLines },
            },
        });
        void this.email.sendCreditNoteEmail(note.id).catch((err) => {
            this.logger.error({ err, orderId }, 'Credit note email failed');
        });
        this.logger.log({ orderId, creditNoteNumber, isPartial }, 'Credit note issued');
        return { creditNoteId: note.id, creditNoteNumber };
    }
    async getCreditNotePdf(creditNoteId) {
        const note = await this.prisma.creditNote.findUnique({
            where: { id: creditNoteId },
            include: { lines: true, invoice: true },
        });
        if (!note)
            throw new common_1.NotFoundException('Credit note not found');
        return this.pdf.generate({
            title: 'Credit Note',
            documentNumber: note.creditNoteNumber,
            documentDate: note.issuedAt.toISOString().slice(0, 10),
            sections: [
                {
                    heading: 'Reference',
                    lines: [
                        `Original Invoice: ${note.invoice.invoiceNumber}`,
                        `Reason: ${note.reason}`,
                        `Partial: ${note.isPartial ? 'Yes' : 'No'}`,
                    ],
                },
                {
                    heading: 'Lines',
                    lines: note.lines.map((l) => `${l.productName} | HSN ${l.hsnCode} | Qty ${l.quantity} | Taxable ${Number(l.taxableAmount).toFixed(2)} | Total ${Number(l.lineTotal).toFixed(2)}`),
                },
                {
                    heading: 'Totals',
                    lines: [
                        `Taxable: INR ${Number(note.taxableAmount).toFixed(2)}`,
                        `CGST: INR ${Number(note.cgstAmount).toFixed(2)}`,
                        `SGST: INR ${Number(note.sgstAmount).toFixed(2)}`,
                        `IGST: INR ${Number(note.igstAmount).toFixed(2)}`,
                        `Grand Total: INR ${Number(note.grandTotal).toFixed(2)}`,
                    ],
                },
            ],
        });
    }
    async nextCreditNoteNumber() {
        const now = new Date();
        const periodKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const count = await this.prisma.creditNote.count({
            where: { creditNoteNumber: { startsWith: `JD-CN-${periodKey}` } },
        });
        return `JD-CN-${periodKey}-${String(count + 1).padStart(6, '0')}`;
    }
};
exports.CreditNoteService = CreditNoteService;
exports.CreditNoteService = CreditNoteService = CreditNoteService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gst_pdf_service_1.GstPdfService,
        gst_email_service_1.GstEmailService])
], CreditNoteService);
function round2(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=credit-note.service.js.map