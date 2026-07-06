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
exports.PatchAdminClaimDto = exports.PatchMerchantClaimDto = exports.ListMerchantClaimsDto = exports.CreateOrderClaimDto = exports.ClaimEvidenceDto = exports.ClaimItemDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const claim_policy_enums_1 = require("../../../common/constants/claim-policy.enums");
class ClaimItemDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { orderItemId: { required: true, type: () => String }, quantity: { required: true, type: () => Number, minimum: 1 } };
    }
}
exports.ClaimItemDto = ClaimItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ClaimItemDto.prototype, "orderItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ClaimItemDto.prototype, "quantity", void 0);
class ClaimEvidenceDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { kind: { required: true, type: () => Object, enum: ['PHOTO', 'VIDEO'] }, url: { required: true, type: () => String } };
    }
}
exports.ClaimEvidenceDto = ClaimEvidenceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['PHOTO', 'VIDEO'] }),
    (0, class_validator_1.IsIn)(['PHOTO', 'VIDEO']),
    __metadata("design:type", String)
], ClaimEvidenceDto.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUrl)({ protocols: ['https'], require_protocol: true }),
    __metadata("design:type", String)
], ClaimEvidenceDto.prototype, "url", void 0);
class CreateOrderClaimDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { claimType: { required: true, type: () => Object }, reason: { required: true, type: () => Object }, reasonNote: { required: false, type: () => String, minLength: 0, maxLength: 2000 }, items: { required: true, type: () => [require("./order-claim.dto").ClaimItemDto] }, evidence: { required: false, type: () => [require("./order-claim.dto").ClaimEvidenceDto] }, idempotencyKey: { required: false, type: () => String, minLength: 8, maxLength: 128 } };
    }
}
exports.CreateOrderClaimDto = CreateOrderClaimDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: claim_policy_enums_1.OrderClaimTypeEnum }),
    (0, class_validator_1.IsEnum)(claim_policy_enums_1.OrderClaimTypeEnum),
    __metadata("design:type", Object)
], CreateOrderClaimDto.prototype, "claimType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: claim_policy_enums_1.ReturnClaimReasonEnum }),
    (0, class_validator_1.IsEnum)(claim_policy_enums_1.ReturnClaimReasonEnum),
    __metadata("design:type", Object)
], CreateOrderClaimDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], CreateOrderClaimDto.prototype, "reasonNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ClaimItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ClaimItemDto),
    __metadata("design:type", Array)
], CreateOrderClaimDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [ClaimEvidenceDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(5),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ClaimEvidenceDto),
    __metadata("design:type", Array)
], CreateOrderClaimDto.prototype, "evidence", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Client idempotency key to prevent duplicate claims' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 128),
    __metadata("design:type", String)
], CreateOrderClaimDto.prototype, "idempotencyKey", void 0);
class ListMerchantClaimsDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: false, type: () => Object }, claimType: { required: false, type: () => Object }, storeId: { required: false, type: () => String }, page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1 } };
    }
}
exports.ListMerchantClaimsDto = ListMerchantClaimsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: claim_policy_enums_1.OrderClaimStatusEnum }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(claim_policy_enums_1.OrderClaimStatusEnum),
    __metadata("design:type", Object)
], ListMerchantClaimsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: claim_policy_enums_1.OrderClaimTypeEnum }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(claim_policy_enums_1.OrderClaimTypeEnum),
    __metadata("design:type", Object)
], ListMerchantClaimsDto.prototype, "claimType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListMerchantClaimsDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListMerchantClaimsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListMerchantClaimsDto.prototype, "limit", void 0);
class PatchMerchantClaimDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { action: { required: true, type: () => Object }, note: { required: false, type: () => String, minLength: 0, maxLength: 2000 }, approvedAmount: { required: false, type: () => Number, minimum: 0 }, returnPickupEnabled: { required: false, type: () => Boolean } };
    }
}
exports.PatchMerchantClaimDto = PatchMerchantClaimDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: [
            'APPROVE',
            'REJECT',
            'REQUEST_EVIDENCE',
            'APPROVE_REPLACEMENT',
            'APPROVE_REFUND',
            'ISSUE_REPLACEMENT',
        ],
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PatchMerchantClaimDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], PatchMerchantClaimDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Approved refund amount (defaults to requested)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PatchMerchantClaimDto.prototype, "approvedAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable return pickup via logistics' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], PatchMerchantClaimDto.prototype, "returnPickupEnabled", void 0);
class PatchAdminClaimDto extends PatchMerchantClaimDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { adminAction: { required: false, type: () => Object } };
    }
}
exports.PatchAdminClaimDto = PatchAdminClaimDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['FORCE_REFUND', 'SUSPEND_MERCHANT'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PatchAdminClaimDto.prototype, "adminAction", void 0);
//# sourceMappingURL=order-claim.dto.js.map