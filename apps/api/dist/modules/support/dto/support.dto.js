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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeSearchDto = exports.AdminListTicketsDto = exports.ResolveTicketDto = exports.FeedbackDto = exports.ReplyTicketDto = exports.CreateTicketDto = exports.ListTicketsQueryDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class ListTicketsQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1, maximum: 100 } };
    }
}
exports.ListTicketsQueryDto = ListTicketsQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListTicketsQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ListTicketsQueryDto.prototype, "limit", void 0);
class CreateTicketDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { categoryCode: { required: true, type: () => String }, subject: { required: true, type: () => String, minLength: 3 }, description: { required: true, type: () => String, minLength: 10 }, priority: { required: false, type: () => Object }, orderId: { required: false, type: () => String }, paymentId: { required: false, type: () => String }, walletTransactionId: { required: false, type: () => String }, gstInvoiceId: { required: false, type: () => String } };
    }
}
exports.CreateTicketDto = CreateTicketDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "categoryCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SupportPriority),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "paymentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "walletTransactionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "gstInvoiceId", void 0);
class ReplyTicketDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { body: { required: true, type: () => String, minLength: 1 }, visibility: { required: false, type: () => Object } };
    }
}
exports.ReplyTicketDto = ReplyTicketDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], ReplyTicketDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SupportMessageVisibility),
    __metadata("design:type", String)
], ReplyTicketDto.prototype, "visibility", void 0);
class FeedbackDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { rating: { required: true, type: () => Number, minimum: 1, maximum: 5 }, comment: { required: false, type: () => String } };
    }
}
exports.FeedbackDto = FeedbackDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], FeedbackDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FeedbackDto.prototype, "comment", void 0);
class ResolveTicketDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { summary: { required: true, type: () => String }, refundApproved: { required: false, type: () => Boolean } };
    }
}
exports.ResolveTicketDto = ResolveTicketDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveTicketDto.prototype, "summary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ResolveTicketDto.prototype, "refundApproved", void 0);
class AdminListTicketsDto extends ListTicketsQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: false, type: () => Object }, priority: { required: false, type: () => Object }, team: { required: false, type: () => String }, refundOnly: { required: false, type: () => Boolean }, actorType: { required: false, type: () => Object } };
    }
}
exports.AdminListTicketsDto = AdminListTicketsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SupportTicketStatus),
    __metadata("design:type", String)
], AdminListTicketsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SupportPriority),
    __metadata("design:type", String)
], AdminListTicketsDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminListTicketsDto.prototype, "team", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdminListTicketsDto.prototype, "refundOnly", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SupportActorType),
    __metadata("design:type", String)
], AdminListTicketsDto.prototype, "actorType", void 0);
class KnowledgeSearchDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { q: { required: false, type: () => String }, category: { required: false, type: () => String }, audience: { required: false, type: () => Object } };
    }
}
exports.KnowledgeSearchDto = KnowledgeSearchDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], KnowledgeSearchDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], KnowledgeSearchDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SupportActorType),
    __metadata("design:type", String)
], KnowledgeSearchDto.prototype, "audience", void 0);
//# sourceMappingURL=support.dto.js.map