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
exports.AdminFinanceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const finance_service_1 = require("./finance.service");
const settlement_batch_service_1 = require("./settlement-batch.service");
const cod_reconciliation_service_1 = require("./cod-reconciliation.service");
const rider_payout_service_1 = require("./rider-payout.service");
const finance_export_service_1 = require("./finance-export.service");
const order_refund_service_1 = require("../payment/order-refund.service");
const settlement_service_1 = require("../settlement/settlement.service");
const finance_dto_1 = require("./dto/finance.dto");
let AdminFinanceController = class AdminFinanceController {
    constructor(finance, batches, cod, riderPayouts, exports, settlement, orderRefunds) {
        this.finance = finance;
        this.batches = batches;
        this.cod = cod;
        this.riderPayouts = riderPayouts;
        this.exports = exports;
        this.settlement = settlement;
        this.orderRefunds = orderRefunds;
    }
    async overview() {
        const data = await this.finance.getControlTower();
        return { success: true, data };
    }
    async alerts() {
        const data = await this.finance.getAlerts();
        return { success: true, data };
    }
    async revenue() {
        const data = await this.exports.exportRevenueSummary();
        return { success: true, data };
    }
    async settlements(query) {
        const data = await this.batches.listSettlements(undefined, query.page, query.limit);
        return { success: true, data };
    }
    async generateSettlements(dto) {
        const count = await this.batches.generateBatches(dto.cycle, dto.merchantProfileId);
        return { success: true, data: { batchesCreated: count } };
    }
    async codList(query) {
        const data = await this.cod.listAdmin(query.status, query.page, query.limit);
        return { success: true, data };
    }
    async codSummary() {
        const data = await this.cod.getSummary();
        return { success: true, data };
    }
    async verifyCod(user, id) {
        const data = await this.cod.verify(user.id, id);
        return { success: true, data };
    }
    async rejectCod(user, id, dto) {
        const data = await this.cod.reject(user.id, id, dto.reason);
        return { success: true, data };
    }
    async failedRefunds(query) {
        const data = await this.orderRefunds.listFailedRefunds(query.page, query.limit);
        return { success: true, data };
    }
    async merchantPayouts(query) {
        const data = await this.settlement.listAdminPayoutRequests(query);
        return { success: true, data };
    }
    async listRiderPayouts(query) {
        const data = await this.riderPayouts.listAdmin(query.page, query.limit);
        return { success: true, data };
    }
    async payRider(user, id, dto) {
        const data = await this.riderPayouts.markPaid(id, user.id, dto.referenceId);
        return { success: true, data };
    }
    async taxes(query) {
        const period = query.periodMonth ?? new Date().toISOString().slice(0, 7);
        const csv = await this.exports.exportTaxReport(period);
        return { success: true, data: { period, csv } };
    }
    async exportSettlements(res, query) {
        const csv = await this.exports.exportSettlementsCsv(query.merchantProfileId);
        res.setHeader('Content-Disposition', 'attachment; filename=settlements.csv');
        res.send(csv);
    }
    async exportPayouts(res) {
        const csv = await this.exports.exportMerchantPayoutsCsv();
        res.setHeader('Content-Disposition', 'attachment; filename=merchant-payouts.csv');
        res.send(csv);
    }
};
exports.AdminFinanceController = AdminFinanceController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Finance control tower overview' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "alerts", null);
__decorate([
    (0, common_1.Get)('revenue'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "revenue", null);
__decorate([
    (0, common_1.Get)('settlements'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.ListFinanceQueryDto]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "settlements", null);
__decorate([
    (0, common_1.Post)('settlements/generate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.GenerateSettlementDto]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "generateSettlements", null);
__decorate([
    (0, common_1.Get)('cod'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.ListFinanceQueryDto]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "codList", null);
__decorate([
    (0, common_1.Get)('cod/summary'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "codSummary", null);
__decorate([
    (0, common_1.Post)('cod/:id/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "verifyCod", null);
__decorate([
    (0, common_1.Post)('cod/:id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, finance_dto_1.RejectCodDto]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "rejectCod", null);
__decorate([
    (0, common_1.Get)('refunds/failed'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List failed order refunds for admin dashboard' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.ListFinanceQueryDto]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "failedRefunds", null);
__decorate([
    (0, common_1.Get)('merchant-payouts'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.ListFinanceQueryDto]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "merchantPayouts", null);
__decorate([
    (0, common_1.Get)('rider-payouts'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.ListFinanceQueryDto]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "listRiderPayouts", null);
__decorate([
    (0, common_1.Post)('rider-payouts/:id/pay'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, finance_dto_1.MarkRiderPayoutPaidDto]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "payRider", null);
__decorate([
    (0, common_1.Get)('taxes'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.ExportQueryDto]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "taxes", null);
__decorate([
    (0, common_1.Get)('exports/settlements'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    (0, common_1.Header)('Content-Type', 'text/csv'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.ExportQueryDto]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "exportSettlements", null);
__decorate([
    (0, common_1.Get)('exports/payouts'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    (0, common_1.Header)('Content-Type', 'text/csv'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "exportPayouts", null);
exports.AdminFinanceController = AdminFinanceController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/finance'),
    __metadata("design:paramtypes", [finance_service_1.FinanceService,
        settlement_batch_service_1.SettlementBatchService,
        cod_reconciliation_service_1.CodReconciliationService,
        rider_payout_service_1.RiderPayoutService,
        finance_export_service_1.FinanceExportService,
        settlement_service_1.SettlementService,
        order_refund_service_1.OrderRefundService])
], AdminFinanceController);
//# sourceMappingURL=admin-finance.controller.js.map