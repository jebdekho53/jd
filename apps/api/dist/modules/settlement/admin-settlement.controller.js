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
exports.AdminSettlementController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const settlement_service_1 = require("./settlement.service");
const settlement_dto_1 = require("./dto/settlement.dto");
let AdminSettlementController = class AdminSettlementController {
    constructor(settlement) {
        this.settlement = settlement;
    }
    getOverview() {
        return this.settlement.getAdminSettlementsOverview().then((data) => ({ success: true, data }));
    }
    listPayoutRequests(query) {
        return this.settlement.listAdminPayoutRequests(query).then((data) => ({ success: true, data }));
    }
    approve(user, id) {
        return this.settlement.approvePayoutRequest(user.id, id).then((data) => ({ success: true, data }));
    }
    reject(user, id, dto) {
        return this.settlement.rejectPayoutRequest(user.id, id, dto).then((data) => ({ success: true, data }));
    }
    process(user, id) {
        return this.settlement.processPayoutRequest(user.id, id).then((data) => ({ success: true, data }));
    }
};
exports.AdminSettlementController = AdminSettlementController;
__decorate([
    (0, common_1.Get)('settlements'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Platform settlement overview, wallets, ledger' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminSettlementController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('payout-requests'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List merchant payout requests' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settlement_dto_1.ListSettlementsQueryDto]),
    __metadata("design:returntype", void 0)
], AdminSettlementController.prototype, "listPayoutRequests", null);
__decorate([
    (0, common_1.Post)('payout-requests/:id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    (0, swagger_1.ApiParam)({ name: 'id' }),
    (0, swagger_1.ApiOperation)({ summary: 'Approve payout request and reserve balance' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminSettlementController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)('payout-requests/:id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    (0, swagger_1.ApiParam)({ name: 'id' }),
    (0, swagger_1.ApiOperation)({ summary: 'Reject payout request' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, settlement_dto_1.RejectPayoutRequestDto]),
    __metadata("design:returntype", void 0)
], AdminSettlementController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)('payout-requests/:id/process'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    (0, swagger_1.ApiParam)({ name: 'id' }),
    (0, swagger_1.ApiOperation)({ summary: 'Process approved payout (bank transfer)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminSettlementController.prototype, "process", null);
exports.AdminSettlementController = AdminSettlementController = __decorate([
    (0, swagger_1.ApiTags)('admin / settlements'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [settlement_service_1.SettlementService])
], AdminSettlementController);
//# sourceMappingURL=admin-settlement.controller.js.map