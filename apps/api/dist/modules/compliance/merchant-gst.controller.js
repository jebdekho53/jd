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
exports.MerchantGstController = void 0;
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
const gst_config_service_1 = require("./gst-config.service");
const compliance_export_service_1 = require("./compliance-export.service");
const invoice_engine_service_1 = require("./invoice-engine.service");
const compliance_dto_1 = require("./dto/compliance.dto");
let MerchantGstController = class MerchantGstController {
    constructor(prisma, compliance, config, exports, invoices) {
        this.prisma = prisma;
        this.compliance = compliance;
        this.config = config;
        this.exports = exports;
        this.invoices = invoices;
    }
    async merchantProfileId(userId) {
        const profile = await this.prisma.merchantProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        return profile?.id ?? null;
    }
    async overview(user, month) {
        const merchantProfileId = await this.merchantProfileId(user.id);
        if (!merchantProfileId)
            return { success: false, message: 'Merchant profile not found' };
        const data = await this.compliance.merchantGstDashboard(merchantProfileId, month);
        return { success: true, data };
    }
    async listInvoices(user, query) {
        const merchantProfileId = await this.merchantProfileId(user.id);
        if (!merchantProfileId)
            return { success: false, message: 'Merchant profile not found' };
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = {
            merchantProfileId,
        };
        if (query.month) {
            const [y, m] = query.month.split('-').map(Number);
            where.invoiceDate = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
        }
        const [items, total] = await Promise.all([
            this.prisma.gSTInvoice.findMany({
                where,
                orderBy: { invoiceDate: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { order: { select: { orderNumber: true } } },
            }),
            this.prisma.gSTInvoice.count({ where }),
        ]);
        return {
            success: true,
            data: {
                items: items.map((i) => ({
                    id: i.id,
                    invoiceNumber: i.invoiceNumber,
                    orderNumber: i.order.orderNumber,
                    grandTotal: Number(i.grandTotal),
                    totalTax: Number(i.totalTax),
                    invoiceDate: i.invoiceDate,
                })),
                total,
                page,
                limit,
            },
        };
    }
    async invoicePdf(user, id, res) {
        const merchantProfileId = await this.merchantProfileId(user.id);
        const invoice = await this.prisma.gSTInvoice.findFirst({
            where: { id, merchantProfileId: merchantProfileId ?? undefined },
        });
        if (!invoice) {
            res.status(404).send('Not found');
            return;
        }
        const pdf = await this.invoices.getInvoicePdf(id);
        res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
        res.send(pdf);
    }
    async exportSummary(user, query, res) {
        const merchantProfileId = await this.merchantProfileId(user.id);
        if (!merchantProfileId) {
            res.status(404).send('Not found');
            return;
        }
        const out = await this.exports.merchantGstSummary(merchantProfileId, query.month, query.format);
        res.setHeader('Content-Type', out.mime);
        res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
        res.send(out.binary ? Buffer.from(out.content, 'base64') : out.content);
    }
    async hsn(q) {
        return { success: true, data: await this.config.listHsnCodes(q) };
    }
    async ensureHsn(dto) {
        return { success: true, data: await this.config.ensureHsnCode(dto.code, dto.gstSlab, dto.description) };
    }
    async updateProductTax(user, productId, dto) {
        const store = await this.prisma.store.findFirst({
            where: { merchantProfile: { userId: user.id }, isActive: true },
            select: { id: true },
        });
        if (!store)
            return { success: false, message: 'Store not found' };
        const updated = await this.config.updateProductTax(productId, store.id, dto);
        if (!updated)
            return { success: false, message: 'Product not found' };
        return { success: true, data: updated };
    }
};
exports.MerchantGstController = MerchantGstController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Merchant GST dashboard' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantGstController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('invoices'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, compliance_dto_1.ListComplianceQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantGstController.prototype, "listInvoices", null);
__decorate([
    (0, common_1.Get)('invoices/:id/pdf'),
    (0, common_1.Header)('Content-Type', 'application/pdf'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MerchantGstController.prototype, "invoicePdf", null);
__decorate([
    (0, common_1.Get)('reports/summary'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, compliance_dto_1.ExportComplianceQueryDto, Object]),
    __metadata("design:returntype", Promise)
], MerchantGstController.prototype, "exportSummary", null);
__decorate([
    (0, common_1.Get)('hsn'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MerchantGstController.prototype, "hsn", null);
__decorate([
    (0, common_1.Post)('hsn'),
    (0, swagger_1.ApiOperation)({ summary: 'Register (or fetch) an HSN code entered by the merchant' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compliance_dto_1.EnsureHsnCodeDto]),
    __metadata("design:returntype", Promise)
], MerchantGstController.prototype, "ensureHsn", null);
__decorate([
    (0, common_1.Patch)('products/:productId/tax'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('productId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, compliance_dto_1.UpdateProductTaxDto]),
    __metadata("design:returntype", Promise)
], MerchantGstController.prototype, "updateProductTax", null);
exports.MerchantGstController = MerchantGstController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/gst'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        compliance_service_1.ComplianceService,
        gst_config_service_1.GstConfigService,
        compliance_export_service_1.ComplianceExportService,
        invoice_engine_service_1.InvoiceEngineService])
], MerchantGstController);
//# sourceMappingURL=merchant-gst.controller.js.map