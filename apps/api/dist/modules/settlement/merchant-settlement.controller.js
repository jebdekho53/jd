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
exports.MerchantSettlementController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const step_up_guard_1 = require("../../common/guards/step-up.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const require_step_up_decorator_1 = require("../../common/decorators/require-step-up.decorator");
const settlement_service_1 = require("./settlement.service");
const settlement_dto_1 = require("./dto/settlement.dto");
let MerchantSettlementController = class MerchantSettlementController {
    constructor(settlement) {
        this.settlement = settlement;
    }
    getEarnings(user) {
        return this.settlement.getMerchantEarnings(user.id).then((data) => ({ success: true, data }));
    }
    listSettlements(user, query) {
        return this.settlement.listMerchantSettlements(user.id, query).then((data) => ({ success: true, data }));
    }
    createPayout(user, dto) {
        return this.settlement.createPayoutRequest(user.id, dto).then((data) => ({ success: true, data }));
    }
    listPayouts(user, query) {
        return this.settlement.listMerchantPayouts(user.id, query).then((data) => ({ success: true, data }));
    }
};
exports.MerchantSettlementController = MerchantSettlementController;
__decorate([
    (0, common_1.Get)('earnings'),
    (0, permissions_decorator_1.Permissions)('earnings:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Wallet balances, commission breakdown, recent revenue' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MerchantSettlementController.prototype, "getEarnings", null);
__decorate([
    (0, common_1.Get)('settlements'),
    (0, permissions_decorator_1.Permissions)('earnings:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Settlement ledger history' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, settlement_dto_1.ListSettlementsQueryDto]),
    __metadata("design:returntype", void 0)
], MerchantSettlementController.prototype, "listSettlements", null);
__decorate([
    (0, common_1.Post)('payout-request'),
    (0, permissions_decorator_1.Permissions)('payouts:request'),
    (0, common_1.UseGuards)(step_up_guard_1.StepUpGuard),
    (0, require_step_up_decorator_1.RequireStepUp)(),
    (0, swagger_1.ApiOperation)({ summary: 'Request a payout from available balance' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, settlement_dto_1.CreatePayoutRequestDto]),
    __metadata("design:returntype", void 0)
], MerchantSettlementController.prototype, "createPayout", null);
__decorate([
    (0, common_1.Get)('payouts'),
    (0, permissions_decorator_1.Permissions)('payouts:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Payout request history' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, settlement_dto_1.ListSettlementsQueryDto]),
    __metadata("design:returntype", void 0)
], MerchantSettlementController.prototype, "listPayouts", null);
exports.MerchantSettlementController = MerchantSettlementController = __decorate([
    (0, swagger_1.ApiTags)('merchant / settlements'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant'),
    __metadata("design:paramtypes", [settlement_service_1.SettlementService])
], MerchantSettlementController);
//# sourceMappingURL=merchant-settlement.controller.js.map