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
exports.FranchisePortalController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const franchise_service_1 = require("./franchise.service");
const franchise_analytics_service_1 = require("./franchise-analytics.service");
const franchise_settlement_service_1 = require("./franchise-settlement.service");
let FranchisePortalController = class FranchisePortalController {
    constructor(franchise, analytics, settlements) {
        this.franchise = franchise;
        this.analytics = analytics;
        this.settlements = settlements;
    }
    async dashboard(user) {
        const id = await this.franchise.resolveFranchiseId(user.id);
        return { success: true, data: await this.analytics.getFranchiseDashboard(id) };
    }
    async stores(user) {
        const id = await this.franchise.resolveFranchiseId(user.id);
        const dash = await this.analytics.getFranchiseDashboard(id);
        return { success: true, data: dash };
    }
    async territory(user) {
        const id = await this.franchise.resolveFranchiseId(user.id);
        const dash = await this.analytics.getFranchiseDashboard(id);
        return {
            success: true,
            data: { territories: dash?.territories ?? [], pincodes: dash?.pincodes ?? [] },
        };
    }
    async finance(user) {
        const id = await this.franchise.resolveFranchiseId(user.id);
        return { success: true, data: await this.settlements.listSettlements(id) };
    }
};
exports.FranchisePortalController = FranchisePortalController;
__decorate([
    (0, common_1.Get)('dashboard'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FranchisePortalController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('stores'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FranchisePortalController.prototype, "stores", null);
__decorate([
    (0, common_1.Get)('territory'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FranchisePortalController.prototype, "territory", null);
__decorate([
    (0, common_1.Get)('finance'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FranchisePortalController.prototype, "finance", null);
exports.FranchisePortalController = FranchisePortalController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('FRANCHISE'),
    (0, common_1.Controller)('franchise'),
    __metadata("design:paramtypes", [franchise_service_1.FranchiseService,
        franchise_analytics_service_1.FranchiseAnalyticsService,
        franchise_settlement_service_1.FranchiseSettlementService])
], FranchisePortalController);
//# sourceMappingURL=franchise-portal.controller.js.map