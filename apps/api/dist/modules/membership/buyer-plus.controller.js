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
exports.BuyerPlusController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const membership_service_1 = require("./membership.service");
const membership_analytics_service_1 = require("./membership-analytics.service");
let BuyerPlusController = class BuyerPlusController {
    constructor(membership, analytics) {
        this.membership = membership;
        this.analytics = analytics;
    }
    async plans() {
        return { success: true, data: await this.membership.listPlans() };
    }
    async subscribe(user, body) {
        return { success: true, data: await this.membership.subscribe(user.id, body.planId, body.yearly) };
    }
    async me(user) {
        const [subscription, savings] = await Promise.all([
            this.membership.getActiveSubscription(user.id),
            this.analytics.getMemberSavings(user.id),
        ]);
        return { success: true, data: { subscription, savings } };
    }
};
exports.BuyerPlusController = BuyerPlusController;
__decorate([
    (0, common_1.Get)('plans'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BuyerPlusController.prototype, "plans", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BuyerPlusController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Get)('me'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BuyerPlusController.prototype, "me", null);
exports.BuyerPlusController = BuyerPlusController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.BUYERS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('buyer/plus'),
    __metadata("design:paramtypes", [membership_service_1.MembershipService,
        membership_analytics_service_1.MembershipAnalyticsService])
], BuyerPlusController);
//# sourceMappingURL=buyer-plus.controller.js.map