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
exports.BuyerPushController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const buyer_push_subscription_service_1 = require("./buyer-push-subscription.service");
const push_subscribe_dto_1 = require("./dto/push-subscribe.dto");
let BuyerPushController = class BuyerPushController {
    constructor(subscriptions) {
        this.subscriptions = subscriptions;
    }
    async status(user) {
        return { success: true, data: await this.subscriptions.getPushStatus(user.id) };
    }
    async subscribe(user, dto) {
        const data = await this.subscriptions.subscribe(user.id, dto);
        return { success: true, data: { id: data.id, endpoint: data.endpoint, isActive: data.isActive } };
    }
    async unsubscribe(user, dto) {
        const data = await this.subscriptions.unsubscribe(user.id, dto);
        return { success: true, data };
    }
};
exports.BuyerPushController = BuyerPushController;
__decorate([
    (0, common_1.Get)('status'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BuyerPushController.prototype, "status", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, push_subscribe_dto_1.PushSubscribeDto]),
    __metadata("design:returntype", Promise)
], BuyerPushController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Post)('unsubscribe'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, push_subscribe_dto_1.PushUnsubscribeDto]),
    __metadata("design:returntype", Promise)
], BuyerPushController.prototype, "unsubscribe", null);
exports.BuyerPushController = BuyerPushController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.BUYERS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Controller)('buyer/notifications/push'),
    __metadata("design:paramtypes", [buyer_push_subscription_service_1.BuyerPushSubscriptionService])
], BuyerPushController);
//# sourceMappingURL=buyer-push.controller.js.map