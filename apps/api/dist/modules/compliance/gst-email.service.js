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
var GstEmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GstEmailService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const gst_pdf_service_1 = require("./gst-pdf.service");
const client_1 = require("@prisma/client");
const email_notification_service_1 = require("../email/email-notification.service");
let GstEmailService = GstEmailService_1 = class GstEmailService {
    constructor(prisma, pdf, emails) {
        this.prisma = prisma;
        this.pdf = pdf;
        this.emails = emails;
        this.logger = new common_1.Logger(GstEmailService_1.name);
    }
    async sendInvoiceEmail(invoiceId) {
        const invoice = await this.prisma.gSTInvoice.findUnique({
            where: { id: invoiceId },
            include: {
                lines: true,
                order: {
                    include: {
                        buyerProfile: { include: { user: { select: { email: true, phone: true } } } },
                    },
                },
            },
        });
        if (!invoice)
            return;
        const email = invoice.order.buyerProfile.user.email;
        if (!email) {
            this.logger.warn({ invoiceId }, 'Invoice email skipped — buyer has no email');
            return;
        }
        try {
            const pdfBuffer = await this.pdf.generateInvoicePdf({
                invoiceNumber: invoice.invoiceNumber,
                invoiceDate: invoice.invoiceDate,
                supplierGstin: invoice.supplierGstin,
                buyerGstin: invoice.buyerGstin,
                supplierState: invoice.supplierState,
                placeOfSupply: invoice.placeOfSupply,
                supplyType: invoice.supplyType === client_1.GstSupplyType.INTRA_STATE ? 'Intra-State' : 'Inter-State',
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
            await this.emails.sendGstInvoiceEmail(invoiceId, pdfBuffer, invoice.invoiceNumber, email);
            await this.prisma.gSTInvoice.update({
                where: { id: invoiceId },
                data: { emailedAt: new Date() },
            });
        }
        catch (err) {
            this.logger.error({ err, invoiceId }, 'Invoice email failed');
        }
    }
    async sendCreditNoteEmail(creditNoteId) {
        const note = await this.prisma.creditNote.findUnique({
            where: { id: creditNoteId },
            include: {
                order: {
                    include: {
                        buyerProfile: { include: { user: { select: { email: true, phone: true } } } },
                    },
                },
            },
        });
        if (!note)
            return;
        const email = note.order.buyerProfile.user.email;
        if (!email)
            return;
        try {
            await this.emails.sendRefundProcessed(note.orderId);
            await this.prisma.creditNote.update({
                where: { id: creditNoteId },
                data: { emailedAt: new Date() },
            });
        }
        catch (err) {
            this.logger.error({ err, creditNoteId }, 'Credit note email failed');
        }
    }
};
exports.GstEmailService = GstEmailService;
exports.GstEmailService = GstEmailService = GstEmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gst_pdf_service_1.GstPdfService,
        email_notification_service_1.EmailNotificationService])
], GstEmailService);
//# sourceMappingURL=gst-email.service.js.map