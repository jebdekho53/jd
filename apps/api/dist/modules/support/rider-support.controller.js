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
exports.RiderSupportController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const support_ticket_service_1 = require("./support-ticket.service");
const knowledge_base_service_1 = require("./knowledge-base.service");
const support_dto_1 = require("./dto/support.dto");
let RiderSupportController = class RiderSupportController {
    constructor(tickets, kb) {
        this.tickets = tickets;
        this.kb = kb;
    }
    async list(user, query) {
        return { success: true, data: await this.tickets.listTicketsForUser(user.id, query.page, query.limit) };
    }
    async create(user, dto) {
        const data = await this.tickets.createTicket({
            requesterUserId: user.id,
            actorType: client_1.SupportActorType.RIDER,
            ...dto,
        });
        return { success: true, data };
    }
    async detail(user, id) {
        return { success: true, data: await this.tickets.getTicketForUser(id, user.id) };
    }
    async reply(user, id, dto) {
        return { success: true, data: await this.tickets.reply(id, user.id, dto.body) };
    }
    async articles() {
        return { success: true, data: await this.kb.search(undefined, undefined, 'RIDER') };
    }
};
exports.RiderSupportController = RiderSupportController;
__decorate([
    (0, common_1.Get)('tickets'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, support_dto_1.ListTicketsQueryDto]),
    __metadata("design:returntype", Promise)
], RiderSupportController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('tickets'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, support_dto_1.CreateTicketDto]),
    __metadata("design:returntype", Promise)
], RiderSupportController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('tickets/:id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RiderSupportController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)('tickets/:id/reply'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, support_dto_1.ReplyTicketDto]),
    __metadata("design:returntype", Promise)
], RiderSupportController.prototype, "reply", null);
__decorate([
    (0, common_1.Get)('articles'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RiderSupportController.prototype, "articles", null);
exports.RiderSupportController = RiderSupportController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('RIDER'),
    (0, common_1.Controller)('rider/support'),
    __metadata("design:paramtypes", [support_ticket_service_1.SupportTicketService,
        knowledge_base_service_1.KnowledgeBaseService])
], RiderSupportController);
//# sourceMappingURL=rider-support.controller.js.map