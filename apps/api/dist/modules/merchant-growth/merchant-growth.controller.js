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
exports.MerchantGrowthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const merchant_growth_service_1 = require("./merchant-growth.service");
const growth_dto_1 = require("./dto/growth.dto");
let MerchantGrowthController = class MerchantGrowthController {
    constructor(growth) {
        this.growth = growth;
    }
    async overview(user, query) {
        return { success: true, data: await this.growth.getOverview(user.id, query.storeId) };
    }
    async recommendations(user, query) {
        return { success: true, data: await this.growth.getRecommendations(user.id, query.storeId) };
    }
    async visibility(user, query) {
        return { success: true, data: await this.growth.getVisibility(user.id, query.storeId) };
    }
    async opportunities(user, query) {
        return { success: true, data: await this.growth.getOpportunities(user.id, query.storeId) };
    }
    async benchmark(user, query) {
        return { success: true, data: await this.growth.getBenchmark(user.id, query.storeId) };
    }
};
exports.MerchantGrowthController = MerchantGrowthController;
__decorate([
    (0, common_1.Get)('overview'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, growth_dto_1.GrowthQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantGrowthController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, growth_dto_1.GrowthQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantGrowthController.prototype, "recommendations", null);
__decorate([
    (0, common_1.Get)('visibility'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, growth_dto_1.GrowthQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantGrowthController.prototype, "visibility", null);
__decorate([
    (0, common_1.Get)('opportunities'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, growth_dto_1.GrowthQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantGrowthController.prototype, "opportunities", null);
__decorate([
    (0, common_1.Get)('benchmark'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, growth_dto_1.GrowthQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantGrowthController.prototype, "benchmark", null);
exports.MerchantGrowthController = MerchantGrowthController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/growth'),
    __metadata("design:paramtypes", [merchant_growth_service_1.MerchantGrowthService])
], MerchantGrowthController);
//# sourceMappingURL=merchant-growth.controller.js.map