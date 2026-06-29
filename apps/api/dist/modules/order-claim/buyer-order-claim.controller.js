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
exports.BuyerOrderClaimController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const order_claim_service_1 = require("./order-claim.service");
const order_claim_dto_1 = require("./dto/order-claim.dto");
let BuyerOrderClaimController = class BuyerOrderClaimController {
    constructor(claims) {
        this.claims = claims;
    }
    async getEligibility(user, orderId) {
        const data = await this.claims.getOrderEligibility(user.id, orderId);
        return { success: true, data };
    }
    async createClaim(user, orderId, dto) {
        const data = await this.claims.createBuyerClaim(user.id, orderId, dto);
        return { success: true, data };
    }
    async listClaims(user, orderId) {
        const data = await this.claims.listBuyerClaims(user.id, orderId);
        return { success: true, data };
    }
};
exports.BuyerOrderClaimController = BuyerOrderClaimController;
__decorate([
    (0, common_1.Get)(':orderId/claims/eligibility'),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Return / refund / replacement eligibility for an order' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BuyerOrderClaimController.prototype, "getEligibility", null);
__decorate([
    (0, common_1.Post)(':orderId/claims'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a return, refund, or replacement claim' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, order_claim_dto_1.CreateOrderClaimDto]),
    __metadata("design:returntype", Promise)
], BuyerOrderClaimController.prototype, "createClaim", null);
__decorate([
    (0, common_1.Get)(':orderId/claims'),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'List claims for an order' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BuyerOrderClaimController.prototype, "listClaims", null);
exports.BuyerOrderClaimController = BuyerOrderClaimController = __decorate([
    (0, swagger_1.ApiTags)('buyer / order claims'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Controller)('buyer/orders'),
    __metadata("design:paramtypes", [order_claim_service_1.OrderClaimService])
], BuyerOrderClaimController);
//# sourceMappingURL=buyer-order-claim.controller.js.map