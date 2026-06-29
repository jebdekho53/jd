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
exports.RiderFinanceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const rider_payout_service_1 = require("./rider-payout.service");
const cod_reconciliation_service_1 = require("./cod-reconciliation.service");
const finance_dto_1 = require("./dto/finance.dto");
const prisma_service_1 = require("../../database/prisma.service");
let RiderFinanceController = class RiderFinanceController {
    constructor(payouts, cod, prisma) {
        this.payouts = payouts;
        this.cod = cod;
        this.prisma = prisma;
    }
    async riderProfileId(userId) {
        const p = await this.prisma.riderProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        return p?.id ?? '';
    }
    async earnings(user) {
        const riderProfileId = await this.riderProfileId(user.id);
        const data = await this.payouts.getRiderEarnings(riderProfileId);
        return { success: true, data };
    }
    async submitCod(user, dto) {
        const riderProfileId = await this.riderProfileId(user.id);
        const data = await this.cod.submitRemittance(riderProfileId, dto);
        return { success: true, data };
    }
};
exports.RiderFinanceController = RiderFinanceController;
__decorate([
    (0, common_1.Get)('earnings'),
    (0, swagger_1.ApiOperation)({ summary: 'Daily/weekly earnings and payout status' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RiderFinanceController.prototype, "earnings", null);
__decorate([
    (0, common_1.Post)('cod/submit'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.CodSubmitDto]),
    __metadata("design:returntype", Promise)
], RiderFinanceController.prototype, "submitCod", null);
exports.RiderFinanceController = RiderFinanceController = __decorate([
    (0, swagger_1.ApiTags)('rider / finance'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('RIDER'),
    (0, common_1.Controller)('rider/finance'),
    __metadata("design:paramtypes", [rider_payout_service_1.RiderPayoutService,
        cod_reconciliation_service_1.CodReconciliationService,
        prisma_service_1.PrismaService])
], RiderFinanceController);
//# sourceMappingURL=rider-finance.controller.js.map