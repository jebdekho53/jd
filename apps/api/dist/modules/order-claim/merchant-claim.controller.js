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
exports.MerchantClaimController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const order_claim_service_1 = require("./order-claim.service");
const order_claim_dto_1 = require("./dto/order-claim.dto");
let MerchantClaimController = class MerchantClaimController {
    constructor(claims) {
        this.claims = claims;
    }
    async listClaims(user, dto) {
        const data = await this.claims.listMerchantClaims(user.id, dto);
        return { success: true, data };
    }
    async analytics(user, storeId) {
        const data = await this.claims.getClaimAnalyticsForMerchant(user.id, storeId);
        return { success: true, data };
    }
    async patchClaim(user, claimId, dto) {
        const data = await this.claims.patchMerchantClaim(user.id, claimId, dto);
        return { success: true, data };
    }
};
exports.MerchantClaimController = MerchantClaimController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List return & refund claims for merchant stores' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, order_claim_dto_1.ListMerchantClaimsDto]),
    __metadata("design:returntype", Promise)
], MerchantClaimController.prototype, "listClaims", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Refund & replacement analytics for merchant' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantClaimController.prototype, "analytics", null);
__decorate([
    (0, common_1.Patch)(':claimId'),
    (0, permissions_decorator_1.Permissions)('orders:write'),
    (0, swagger_1.ApiParam)({ name: 'claimId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Approve, reject, or action a claim' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('claimId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, order_claim_dto_1.PatchMerchantClaimDto]),
    __metadata("design:returntype", Promise)
], MerchantClaimController.prototype, "patchClaim", null);
exports.MerchantClaimController = MerchantClaimController = __decorate([
    (0, swagger_1.ApiTags)('merchant / claims'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/claims'),
    __metadata("design:paramtypes", [order_claim_service_1.OrderClaimService])
], MerchantClaimController);
//# sourceMappingURL=merchant-claim.controller.js.map