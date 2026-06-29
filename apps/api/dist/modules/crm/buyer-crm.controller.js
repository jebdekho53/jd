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
exports.BuyerCrmController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const notification_orchestrator_service_1 = require("./notification-orchestrator.service");
const marketing_event_service_1 = require("./marketing-event.service");
const recommendation_service_1 = require("./recommendation.service");
const crm_dto_1 = require("./dto/crm.dto");
let BuyerCrmController = class BuyerCrmController {
    constructor(notifications, events, recommendationService) {
        this.notifications = notifications;
        this.events = events;
        this.recommendationService = recommendationService;
    }
    async getPreferences(user) {
        return { success: true, data: await this.notifications.getPreferences(user.id) };
    }
    async updatePreferences(user, dto) {
        return { success: true, data: await this.notifications.updatePreferences(user.id, dto) };
    }
    async trackEvent(user, dto) {
        const data = await this.events.track({
            userId: user.id,
            ...dto,
            metadata: dto.metadata,
        });
        return { success: true, data };
    }
    async recommendations(user, type = 'product') {
        return { success: true, data: await this.recommendationService.getRecommendations(user.id, type) };
    }
    async notificationHistory(user, page = 1) {
        return { success: true, data: await this.notifications.listDeliveries(user.id, Number(page)) };
    }
    async inbox(user, page = 1) {
        return { success: true, data: await this.notifications.listInApp(user.id, Number(page)) };
    }
    async markRead(user, id) {
        await this.notifications.markInAppRead(user.id, id);
        return { success: true };
    }
    async markAllRead(user) {
        await this.notifications.markAllInAppRead(user.id);
        return { success: true };
    }
};
exports.BuyerCrmController = BuyerCrmController;
__decorate([
    (0, common_1.Get)('preferences'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BuyerCrmController.prototype, "getPreferences", null);
__decorate([
    (0, common_1.Patch)('preferences'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, crm_dto_1.UpdatePreferencesDto]),
    __metadata("design:returntype", Promise)
], BuyerCrmController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Post)('events'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, crm_dto_1.TrackEventDto]),
    __metadata("design:returntype", Promise)
], BuyerCrmController.prototype, "trackEvent", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BuyerCrmController.prototype, "recommendations", null);
__decorate([
    (0, common_1.Get)('notifications'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BuyerCrmController.prototype, "notificationHistory", null);
__decorate([
    (0, common_1.Get)('inbox'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BuyerCrmController.prototype, "inbox", null);
__decorate([
    (0, common_1.Patch)('inbox/:id/read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BuyerCrmController.prototype, "markRead", null);
__decorate([
    (0, common_1.Patch)('inbox/read-all'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BuyerCrmController.prototype, "markAllRead", null);
exports.BuyerCrmController = BuyerCrmController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.BUYERS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Controller)('buyer/crm'),
    __metadata("design:paramtypes", [notification_orchestrator_service_1.NotificationOrchestratorService,
        marketing_event_service_1.MarketingEventService,
        recommendation_service_1.RecommendationService])
], BuyerCrmController);
//# sourceMappingURL=buyer-crm.controller.js.map