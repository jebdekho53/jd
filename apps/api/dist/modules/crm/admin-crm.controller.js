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
exports.AdminCrmController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const segment_service_1 = require("./segment.service");
const journey_engine_service_1 = require("./journey-engine.service");
const notification_orchestrator_service_1 = require("./notification-orchestrator.service");
const crm_analytics_service_1 = require("./crm-analytics.service");
const customer_360_service_1 = require("./customer-360.service");
const crm_dto_1 = require("./dto/crm.dto");
const prisma_service_1 = require("../../database/prisma.service");
let AdminCrmController = class AdminCrmController {
    constructor(segments, journeys, notifications, analytics, customer360, prisma) {
        this.segments = segments;
        this.journeys = journeys;
        this.notifications = notifications;
        this.analytics = analytics;
        this.customer360 = customer360;
        this.prisma = prisma;
    }
    async overview() {
        return { success: true, data: await this.analytics.getDashboard() };
    }
    async listSegments() {
        return { success: true, data: await this.segments.listSegments() };
    }
    async refreshSegment(id) {
        const segment = await this.prisma.customerSegment.findUnique({ where: { id } });
        if (!segment)
            return { success: false };
        const count = await this.segments.refreshSegment(id, segment.kind);
        return { success: true, data: { memberCount: count } };
    }
    async segmentMembers(id, query) {
        return { success: true, data: await this.segments.getSegmentMembers(id, query.page, query.limit) };
    }
    async listJourneys() {
        return { success: true, data: await this.journeys.listJourneys() };
    }
    async listCampaigns() {
        return { success: true, data: await this.analytics.listCampaigns() };
    }
    async createPushCampaign(dto) {
        const campaign = await this.prisma.pushCampaign.create({
            data: {
                name: dto.name,
                segmentId: dto.segmentId,
                templateCode: dto.templateCode,
                status: 'DRAFT',
            },
        });
        return { success: true, data: campaign };
    }
    async templates(category) {
        return { success: true, data: await this.notifications.listTemplates(category) };
    }
    async deliveries(query) {
        const items = await this.prisma.notificationDelivery.findMany({
            orderBy: { createdAt: 'desc' },
            take: query.limit,
            skip: ((query.page ?? 1) - 1) * (query.limit ?? 20),
        });
        return { success: true, data: { items } };
    }
    async customerProfile(userId) {
        return { success: true, data: await this.customer360.getProfile(userId) };
    }
    async selectWinner(type, id) {
        const winner = await this.analytics.selectAbWinner(type, id);
        return { success: true, data: { winner } };
    }
};
exports.AdminCrmController = AdminCrmController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminCrmController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('segments'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminCrmController.prototype, "listSegments", null);
__decorate([
    (0, common_1.Post)('segments/:id/refresh'),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminCrmController.prototype, "refreshSegment", null);
__decorate([
    (0, common_1.Get)('segments/:id/members'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, crm_dto_1.ListQueryDto]),
    __metadata("design:returntype", Promise)
], AdminCrmController.prototype, "segmentMembers", null);
__decorate([
    (0, common_1.Get)('journeys'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminCrmController.prototype, "listJourneys", null);
__decorate([
    (0, common_1.Get)('campaigns'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminCrmController.prototype, "listCampaigns", null);
__decorate([
    (0, common_1.Post)('campaigns/push'),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crm_dto_1.CreatePushCampaignDto]),
    __metadata("design:returntype", Promise)
], AdminCrmController.prototype, "createPushCampaign", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminCrmController.prototype, "templates", null);
__decorate([
    (0, common_1.Get)('notifications/deliveries'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crm_dto_1.ListQueryDto]),
    __metadata("design:returntype", Promise)
], AdminCrmController.prototype, "deliveries", null);
__decorate([
    (0, common_1.Get)('customers/:userId'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminCrmController.prototype, "customerProfile", null);
__decorate([
    (0, common_1.Post)('campaigns/:type/:id/select-winner'),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminCrmController.prototype, "selectWinner", null);
exports.AdminCrmController = AdminCrmController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/crm'),
    __metadata("design:paramtypes", [segment_service_1.SegmentService,
        journey_engine_service_1.JourneyEngineService,
        notification_orchestrator_service_1.NotificationOrchestratorService,
        crm_analytics_service_1.CrmAnalyticsService,
        customer_360_service_1.Customer360Service,
        prisma_service_1.PrismaService])
], AdminCrmController);
//# sourceMappingURL=admin-crm.controller.js.map