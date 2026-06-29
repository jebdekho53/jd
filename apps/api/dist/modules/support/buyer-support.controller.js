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
exports.BuyerSupportController = void 0;
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
let BuyerSupportController = class BuyerSupportController {
    constructor(tickets, kb) {
        this.tickets = tickets;
        this.kb = kb;
    }
    async categories() {
        return { success: true, data: await this.kb.listCategories('BUYER') };
    }
    async articles(q, category) {
        return { success: true, data: await this.kb.search(q, category, 'BUYER') };
    }
    async list(user, query) {
        return { success: true, data: await this.tickets.listTicketsForUser(user.id, query.page, query.limit) };
    }
    async create(user, dto) {
        const data = await this.tickets.createTicket({
            requesterUserId: user.id,
            actorType: client_1.SupportActorType.BUYER,
            ...dto,
        });
        return { success: true, data };
    }
    async detail(user, id) {
        return { success: true, data: await this.tickets.getTicketForUser(id, user.id) };
    }
    async reply(user, id, dto) {
        const data = await this.tickets.reply(id, user.id, dto.body);
        return { success: true, data };
    }
    async feedback(user, id, dto) {
        const data = await this.tickets.submitFeedback(id, user.id, dto.rating, dto.comment);
        return { success: true, data };
    }
};
exports.BuyerSupportController = BuyerSupportController;
__decorate([
    (0, common_1.Get)('categories'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BuyerSupportController.prototype, "categories", null);
__decorate([
    (0, common_1.Get)('articles'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BuyerSupportController.prototype, "articles", null);
__decorate([
    (0, common_1.Get)('tickets'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, support_dto_1.ListTicketsQueryDto]),
    __metadata("design:returntype", Promise)
], BuyerSupportController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('tickets'),
    (0, swagger_1.ApiOperation)({ summary: 'Create support ticket' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, support_dto_1.CreateTicketDto]),
    __metadata("design:returntype", Promise)
], BuyerSupportController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('tickets/:id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BuyerSupportController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)('tickets/:id/reply'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, support_dto_1.ReplyTicketDto]),
    __metadata("design:returntype", Promise)
], BuyerSupportController.prototype, "reply", null);
__decorate([
    (0, common_1.Post)('tickets/:id/feedback'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, support_dto_1.FeedbackDto]),
    __metadata("design:returntype", Promise)
], BuyerSupportController.prototype, "feedback", null);
exports.BuyerSupportController = BuyerSupportController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.BUYERS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Controller)('buyer/support'),
    __metadata("design:paramtypes", [support_ticket_service_1.SupportTicketService,
        knowledge_base_service_1.KnowledgeBaseService])
], BuyerSupportController);
//# sourceMappingURL=buyer-support.controller.js.map