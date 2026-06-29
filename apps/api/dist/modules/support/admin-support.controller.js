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
exports.AdminSupportController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const support_ticket_service_1 = require("./support-ticket.service");
const support_analytics_service_1 = require("./support-analytics.service");
const customer_timeline_service_1 = require("./customer-timeline.service");
const knowledge_base_service_1 = require("./knowledge-base.service");
const support_dto_1 = require("./dto/support.dto");
let AdminSupportController = class AdminSupportController {
    constructor(tickets, analytics, timeline, kb) {
        this.tickets = tickets;
        this.analytics = analytics;
        this.timeline = timeline;
        this.kb = kb;
    }
    async overview() {
        return { success: true, data: await this.analytics.getDashboard() };
    }
    async listTickets(query) {
        return { success: true, data: await this.analytics.listAdminTickets(query) };
    }
    async open(query) {
        return this.listTickets({ ...query, status: client_1.SupportTicketStatus.OPEN });
    }
    async escalated(query) {
        return this.listTickets({ ...query, status: client_1.SupportTicketStatus.ESCALATED });
    }
    async highPriority(query) {
        return this.listTickets({ ...query, priority: client_1.SupportPriority.HIGH });
    }
    async financeRelated(query) {
        return this.listTickets({ ...query, team: 'FINANCE' });
    }
    async merchantRelated(query) {
        return this.listTickets({ ...query, actorType: client_1.SupportActorType.MERCHANT });
    }
    async riderRelated(query) {
        return this.listTickets({ ...query, actorType: client_1.SupportActorType.RIDER });
    }
    async refundRelated(query) {
        return this.listTickets({ ...query, refundOnly: true });
    }
    async detail(id) {
        const ticket = await this.tickets.getTicketForUser(id, '', true);
        const customerTimeline = await this.timeline.getTimelineForTicket(id);
        return { success: true, data: { ticket, customerTimeline } };
    }
    async reply(user, id, dto) {
        const visibility = dto.visibility ?? client_1.SupportMessageVisibility.PUBLIC;
        const data = await this.tickets.reply(id, user.id, dto.body, visibility, true);
        return { success: true, data };
    }
    async resolve(user, id, dto) {
        const data = await this.tickets.resolveTicket(id, user.id, dto.summary, dto.refundApproved);
        return { success: true, data };
    }
    async knowledge(query) {
        return {
            success: true,
            data: await this.kb.search(query.q, query.category, query.audience),
        };
    }
};
exports.AdminSupportController = AdminSupportController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Support analytics dashboard' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSupportController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('tickets'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_dto_1.AdminListTicketsDto]),
    __metadata("design:returntype", Promise)
], AdminSupportController.prototype, "listTickets", null);
__decorate([
    (0, common_1.Get)('tickets/open'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_dto_1.AdminListTicketsDto]),
    __metadata("design:returntype", Promise)
], AdminSupportController.prototype, "open", null);
__decorate([
    (0, common_1.Get)('tickets/escalated'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_dto_1.AdminListTicketsDto]),
    __metadata("design:returntype", Promise)
], AdminSupportController.prototype, "escalated", null);
__decorate([
    (0, common_1.Get)('tickets/high-priority'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_dto_1.AdminListTicketsDto]),
    __metadata("design:returntype", Promise)
], AdminSupportController.prototype, "highPriority", null);
__decorate([
    (0, common_1.Get)('tickets/finance-related'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_dto_1.AdminListTicketsDto]),
    __metadata("design:returntype", Promise)
], AdminSupportController.prototype, "financeRelated", null);
__decorate([
    (0, common_1.Get)('tickets/merchant-related'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_dto_1.AdminListTicketsDto]),
    __metadata("design:returntype", Promise)
], AdminSupportController.prototype, "merchantRelated", null);
__decorate([
    (0, common_1.Get)('tickets/rider-related'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_dto_1.AdminListTicketsDto]),
    __metadata("design:returntype", Promise)
], AdminSupportController.prototype, "riderRelated", null);
__decorate([
    (0, common_1.Get)('tickets/refund-related'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_dto_1.AdminListTicketsDto]),
    __metadata("design:returntype", Promise)
], AdminSupportController.prototype, "refundRelated", null);
__decorate([
    (0, common_1.Get)('tickets/:id'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminSupportController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)('tickets/:id/reply'),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, support_dto_1.ReplyTicketDto]),
    __metadata("design:returntype", Promise)
], AdminSupportController.prototype, "reply", null);
__decorate([
    (0, common_1.Post)('tickets/:id/resolve'),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, support_dto_1.ResolveTicketDto]),
    __metadata("design:returntype", Promise)
], AdminSupportController.prototype, "resolve", null);
__decorate([
    (0, common_1.Get)('knowledge'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_dto_1.KnowledgeSearchDto]),
    __metadata("design:returntype", Promise)
], AdminSupportController.prototype, "knowledge", null);
exports.AdminSupportController = AdminSupportController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/support-center'),
    __metadata("design:paramtypes", [support_ticket_service_1.SupportTicketService,
        support_analytics_service_1.SupportAnalyticsService,
        customer_timeline_service_1.CustomerTimelineService,
        knowledge_base_service_1.KnowledgeBaseService])
], AdminSupportController);
//# sourceMappingURL=admin-support.controller.js.map