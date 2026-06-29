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
exports.MerchantFinanceController = void 0;
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
const settlement_service_1 = require("../settlement/settlement.service");
const settlement_batch_service_1 = require("./settlement-batch.service");
const order_financials_service_1 = require("./order-financials.service");
const finance_export_service_1 = require("./finance-export.service");
const finance_dto_1 = require("./dto/finance.dto");
const prisma_service_1 = require("../../database/prisma.service");
let MerchantFinanceController = class MerchantFinanceController {
    constructor(settlement, batches, orderFinancials, exports, prisma) {
        this.settlement = settlement;
        this.batches = batches;
        this.orderFinancials = orderFinancials;
        this.exports = exports;
        this.prisma = prisma;
    }
    async overview(user) {
        const earnings = await this.settlement.getMerchantEarnings(user.id);
        const profile = await this.prisma.merchantProfile.findUnique({
            where: { userId: user.id },
            select: { id: true },
        });
        const batches = profile
            ? await this.batches.listSettlements(profile.id, 1, 5)
            : { settlements: [], meta: { page: 1, limit: 5, total: 0 } };
        return {
            success: true,
            data: {
                todayEarnings: earnings.recentOrdersRevenue[0]?.netAmount ?? 0,
                wallet: earnings.wallet,
                commissionBreakdown: earnings.commissionBreakdown,
                pendingSettlement: earnings.wallet.pendingBalance,
                paidSettlement: earnings.wallet.totalPaidOut,
                recentOrders: earnings.recentOrdersRevenue,
                settlementBatches: batches.settlements,
                openPayout: earnings.openPayoutRequest,
            },
        };
    }
    async settlements(user, query) {
        const data = await this.settlement.listMerchantSettlements(user.id, query);
        return { success: true, data };
    }
    async payouts(user, query) {
        const data = await this.settlement.listMerchantPayouts(user.id, query);
        return { success: true, data };
    }
    async orderBreakdown(user, orderId) {
        const data = await this.orderFinancials.getOrderFinancialsForMerchant(orderId, user.id);
        return { success: true, data };
    }
    async downloadStatement(user, res) {
        const profile = await this.prisma.merchantProfile.findUnique({
            where: { userId: user.id },
            select: { id: true },
        });
        const csv = await this.exports.exportSettlementsCsv(profile?.id);
        res.setHeader('Content-Disposition', 'attachment; filename=merchant-statement.csv');
        res.send(csv);
    }
};
exports.MerchantFinanceController = MerchantFinanceController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('earnings:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Merchant finance dashboard' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantFinanceController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('settlements'),
    (0, permissions_decorator_1.Permissions)('earnings:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.ListFinanceQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantFinanceController.prototype, "settlements", null);
__decorate([
    (0, common_1.Get)('payouts'),
    (0, permissions_decorator_1.Permissions)('earnings:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.ListFinanceQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantFinanceController.prototype, "payouts", null);
__decorate([
    (0, common_1.Get)('orders/:orderId'),
    (0, permissions_decorator_1.Permissions)('earnings:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantFinanceController.prototype, "orderBreakdown", null);
__decorate([
    (0, common_1.Get)('statement'),
    (0, permissions_decorator_1.Permissions)('earnings:read'),
    (0, common_1.Header)('Content-Type', 'text/csv'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MerchantFinanceController.prototype, "downloadStatement", null);
exports.MerchantFinanceController = MerchantFinanceController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/finance'),
    __metadata("design:paramtypes", [settlement_service_1.SettlementService,
        settlement_batch_service_1.SettlementBatchService,
        order_financials_service_1.OrderFinancialsService,
        finance_export_service_1.FinanceExportService,
        prisma_service_1.PrismaService])
], MerchantFinanceController);
//# sourceMappingURL=merchant-finance.controller.js.map