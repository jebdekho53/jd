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
var InvoiceEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceEngineService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const gst_calculator_service_1 = require("./gst-calculator.service");
const gst_pdf_service_1 = require("./gst-pdf.service");
const gst_email_service_1 = require("./gst-email.service");
const gst_validation_util_1 = require("./gst-validation.util");
let InvoiceEngineService = InvoiceEngineService_1 = class InvoiceEngineService {
    constructor(prisma, calculator, pdf, email) {
        this.prisma = prisma;
        this.calculator = calculator;
        this.pdf = pdf;
        this.email = email;
        this.logger = new common_1.Logger(InvoiceEngineService_1.name);
    }
    async generateForOrder(orderId) {
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
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const supplierGstin = order.store.merchantProfile.gstNumber;
        if (supplierGstin && !(0, gst_validation_util_1.isValidGstin)(supplierGstin)) {
            throw new common_1.BadRequestException('Merchant GSTIN is invalid');
        }
        const deliveryAddress = order.deliveryAddress;
        const supplierState = (supplierGstin ? (0, gst_validation_util_1.gstinStateCode)(supplierGstin) : null) ??
            mapStateNameToCode(order.store.city?.state) ??
            '27';
        const buyerState = deliveryAddress.stateCode ?? deliveryAddress.state ?? supplierState;
        const supplyType = this.calculator.resolveSupplyType(supplierState, buyerState);
        const placeOfSupply = deliveryAddress.state ?? deliveryAddress.city ?? supplierState;
        const lineBreakdowns = [];
        for (const item of order.items) {
            const gstSlab = item.product.gstSlab ??
                item.product.hsnCodeRef?.defaultGstSlab ??
                client_1.GstSlab.EIGHTEEN;
            const rates = await this.calculator.getRatesForSlab(gstSlab);
            const breakdown = this.calculator.computeLine({
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                discount: Number(item.discount),
                gstSlab,
                taxInclusive: item.product.taxInclusive,
            }, supplyType, rates);
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
        const subtotal = lineBreakdowns.reduce((s, l) => s + l.quantity * l.unitPrice - Number(order.items.find((i) => i.id === l.orderItemId)?.discount ?? 0), 0);
        const deliveryFee = Number(order.deliveryFee);
        const grandTotal = totals.grandTotal + deliveryFee;
        const invoiceNumber = await this.nextInvoiceNumber();
        const invoice = await this.prisma.$transaction(async (tx) => {
            const dup = await tx.gSTInvoice.findUnique({ where: { orderId } });
            if (dup)
                throw new common_1.ConflictException('Invoice already exists for this order');
            const inv = await tx.gSTInvoice.create({
                data: {
                    invoiceNumber,
                    orderId,
                    storeId: order.storeId,
                    merchantProfileId: order.store.merchantProfileId,
                    buyerProfileId: order.buyerProfileId,
                    supplyType,
                    supplierGstin: supplierGstin ? (0, gst_validation_util_1.normalizeGstin)(supplierGstin) : null,
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
    async getInvoicePdf(invoiceId) {
        const invoice = await this.prisma.gSTInvoice.findUnique({
            where: { id: invoiceId },
            include: { lines: true },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        return this.pdf.generateInvoicePdf({
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
    }
    async nextInvoiceNumber() {
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
};
exports.InvoiceEngineService = InvoiceEngineService;
exports.InvoiceEngineService = InvoiceEngineService = InvoiceEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gst_calculator_service_1.GstCalculatorService,
        gst_pdf_service_1.GstPdfService,
        gst_email_service_1.GstEmailService])
], InvoiceEngineService);
function mapStateNameToCode(stateName) {
    if (!stateName)
        return null;
    const map = {
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
//# sourceMappingURL=invoice-engine.service.js.map