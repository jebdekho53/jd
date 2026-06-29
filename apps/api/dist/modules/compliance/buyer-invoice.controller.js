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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyerInvoiceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const prisma_service_1 = require("../../database/prisma.service");
const compliance_service_1 = require("./compliance.service");
const invoice_engine_service_1 = require("./invoice-engine.service");
const gst_email_service_1 = require("./gst-email.service");
let BuyerInvoiceController = class BuyerInvoiceController {
    constructor(prisma, compliance, invoices, email) {
        this.prisma = prisma;
        this.compliance = compliance;
        this.invoices = invoices;
        this.email = email;
    }
    async buyerProfileId(userId) {
        const profile = await this.prisma.buyerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        return profile?.id ?? null;
    }
    async getInvoice(user, orderId) {
        const buyerProfileId = await this.buyerProfileId(user.id);
        if (!buyerProfileId)
            return { success: false, message: 'Buyer profile not found' };
        const data = await this.compliance.buyerInvoiceForOrder(orderId, buyerProfileId);
        if (!data)
            return { success: true, data: null };
        return { success: true, data };
    }
    async downloadPdf(user, orderId, res) {
        const buyerProfileId = await this.buyerProfileId(user.id);
        const invoice = await this.prisma.gSTInvoice.findFirst({
            where: { orderId, buyerProfileId: buyerProfileId ?? undefined },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        const pdf = await this.invoices.getInvoicePdf(invoice.id);
        res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
        res.send(pdf);
    }
    async emailInvoice(user, orderId) {
        const buyerProfileId = await this.buyerProfileId(user.id);
        const invoice = await this.prisma.gSTInvoice.findFirst({
            where: { orderId, buyerProfileId: buyerProfileId ?? undefined },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        await this.email.sendInvoiceEmail(invoice.id);
        return { success: true, message: 'Invoice email sent' };
    }
};
exports.BuyerInvoiceController = BuyerInvoiceController;
__decorate([
    (0, common_1.Get)(':orderId/invoice'),
    (0, swagger_1.ApiOperation)({ summary: 'View GST invoice for order' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BuyerInvoiceController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Get)(':orderId/invoice/pdf'),
    (0, common_1.Header)('Content-Type', 'application/pdf'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BuyerInvoiceController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Post)(':orderId/invoice/email'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BuyerInvoiceController.prototype, "emailInvoice", null);
exports.BuyerInvoiceController = BuyerInvoiceController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.BUYERS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Controller)('buyer/orders'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        compliance_service_1.ComplianceService,
        invoice_engine_service_1.InvoiceEngineService,
        gst_email_service_1.GstEmailService])
], BuyerInvoiceController);
//# sourceMappingURL=buyer-invoice.controller.js.map