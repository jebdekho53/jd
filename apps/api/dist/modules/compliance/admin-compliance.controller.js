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
exports.AdminComplianceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const compliance_service_1 = require("./compliance.service");
const gst_config_service_1 = require("./gst-config.service");
const compliance_export_service_1 = require("./compliance-export.service");
const tds_tcs_service_1 = require("./tds-tcs.service");
const invoice_engine_service_1 = require("./invoice-engine.service");
const credit_note_service_1 = require("./credit-note.service");
const prisma_service_1 = require("../../database/prisma.service");
const compliance_dto_1 = require("./dto/compliance.dto");
let AdminComplianceController = class AdminComplianceController {
    constructor(prisma, compliance, config, exports, tdsTcs, invoices, creditNotes) {
        this.prisma = prisma;
        this.compliance = compliance;
        this.config = config;
        this.exports = exports;
        this.tdsTcs = tdsTcs;
        this.invoices = invoices;
        this.creditNotes = creditNotes;
    }
    async overview() {
        return { success: true, data: await this.compliance.getOverview() };
    }
    async taxRates() {
        return { success: true, data: await this.config.listTaxRates() };
    }
    async jurisdictions() {
        return { success: true, data: await this.config.listJurisdictions() };
    }
    async hsn(q) {
        return { success: true, data: await this.config.listHsnCodes(q) };
    }
    async listInvoices(query) {
        return { success: true, data: await this.compliance.listInvoices(query.page, query.limit, query.month) };
    }
    async invoiceDetail(id) {
        return { success: true, data: await this.compliance.getInvoiceDetail(id) };
    }
    async invoicePdf(id, res) {
        const pdf = await this.invoices.getInvoicePdf(id);
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
        res.send(pdf);
    }
    async listCreditNotes(query) {
        return { success: true, data: await this.compliance.listCreditNotes(query.page, query.limit) };
    }
    async creditNotePdf(id, res) {
        const pdf = await this.creditNotes.getCreditNotePdf(id);
        res.send(pdf);
    }
    async listDebitNotes(query) {
        return { success: true, data: await this.compliance.listDebitNotes(query.page, query.limit) };
    }
    async tds(month) {
        const records = await this.prisma.tdsRecord.findMany({
            where: month ? { periodMonth: month } : undefined,
            orderBy: { periodMonth: 'desc' },
            take: 50,
            include: { merchantProfile: { select: { businessName: true } } },
        });
        return {
            success: true,
            data: records.map((r) => ({
                id: r.id,
                merchant: r.merchantProfile.businessName,
                periodMonth: r.periodMonth,
                taxableAmount: Number(r.taxableAmount),
                tdsRate: Number(r.tdsRate),
                tdsAmount: Number(r.tdsAmount),
            })),
        };
    }
    async tcs(month) {
        return { success: true, data: await this.tdsTcs.platformTcsSummary(month) };
    }
    async syncTdsTcs(dto) {
        const data = await this.tdsTcs.syncMonthlyFromInvoices(dto.periodMonth);
        return { success: true, data };
    }
    async monthlyGst(query, res) {
        const month = query.month ?? new Date().toISOString().slice(0, 7);
        const out = await this.exports.monthlyGstSummary(month, query.format);
        return this.sendExport(res, out);
    }
    async invoiceRegister(query, res) {
        const out = await this.exports.invoiceRegister(query.month, query.format);
        return this.sendExport(res, out);
    }
    async creditRegister(query, res) {
        const out = await this.exports.creditNoteRegister(query.month, query.format);
        return this.sendExport(res, out);
    }
    async taxLiability(query, res) {
        const month = query.month ?? new Date().toISOString().slice(0, 7);
        const out = await this.exports.taxLiabilityReport(month, query.format);
        return this.sendExport(res, out);
    }
    sendExport(res, out) {
        res.setHeader('Content-Type', out.mime);
        res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
        if (out.binary) {
            res.send(Buffer.from(out.content, 'base64'));
        }
        else {
            res.send(out.content);
        }
    }
};
exports.AdminComplianceController = AdminComplianceController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Compliance center overview' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('gst/rates'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "taxRates", null);
__decorate([
    (0, common_1.Get)('gst/jurisdictions'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "jurisdictions", null);
__decorate([
    (0, common_1.Get)('gst/hsn'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "hsn", null);
__decorate([
    (0, common_1.Get)('invoices'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compliance_dto_1.ListComplianceQueryDto]),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "listInvoices", null);
__decorate([
    (0, common_1.Get)('invoices/:id'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "invoiceDetail", null);
__decorate([
    (0, common_1.Get)('invoices/:id/pdf'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    (0, common_1.Header)('Content-Type', 'application/pdf'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "invoicePdf", null);
__decorate([
    (0, common_1.Get)('credit-notes'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compliance_dto_1.ListComplianceQueryDto]),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "listCreditNotes", null);
__decorate([
    (0, common_1.Get)('credit-notes/:id/pdf'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    (0, common_1.Header)('Content-Type', 'application/pdf'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "creditNotePdf", null);
__decorate([
    (0, common_1.Get)('debit-notes'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compliance_dto_1.ListComplianceQueryDto]),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "listDebitNotes", null);
__decorate([
    (0, common_1.Get)('tds'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "tds", null);
__decorate([
    (0, common_1.Get)('tcs'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "tcs", null);
__decorate([
    (0, common_1.Post)('tds-tcs/sync'),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compliance_dto_1.SyncTdsTcsDto]),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "syncTdsTcs", null);
__decorate([
    (0, common_1.Get)('reports/monthly-gst'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compliance_dto_1.ExportComplianceQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "monthlyGst", null);
__decorate([
    (0, common_1.Get)('reports/invoice-register'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compliance_dto_1.ExportComplianceQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "invoiceRegister", null);
__decorate([
    (0, common_1.Get)('reports/credit-note-register'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compliance_dto_1.ExportComplianceQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "creditRegister", null);
__decorate([
    (0, common_1.Get)('reports/tax-liability'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compliance_dto_1.ExportComplianceQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AdminComplianceController.prototype, "taxLiability", null);
exports.AdminComplianceController = AdminComplianceController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/compliance'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        compliance_service_1.ComplianceService,
        gst_config_service_1.GstConfigService,
        compliance_export_service_1.ComplianceExportService,
        tds_tcs_service_1.TdsTcsService,
        invoice_engine_service_1.InvoiceEngineService,
        credit_note_service_1.CreditNoteService])
], AdminComplianceController);
//# sourceMappingURL=admin-compliance.controller.js.map