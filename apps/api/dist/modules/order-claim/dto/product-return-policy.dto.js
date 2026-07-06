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
exports.ApplyAiReturnPolicySuggestionDto = exports.ProductReturnPolicyDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const claim_policy_enums_1 = require("../../../common/constants/claim-policy.enums");
class ProductReturnPolicyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { isReturnable: { required: false, type: () => Boolean }, isRefundable: { required: false, type: () => Boolean }, isReplaceable: { required: false, type: () => Boolean }, returnWindowHours: { required: false, type: () => Number, minimum: 1 }, approvalMode: { required: false, type: () => Object }, proofRequired: { required: false, type: () => Object }, autoApproveBelowAmount: { required: false, type: () => Number, minimum: 0 }, returnReasons: { required: false, type: () => [Object] }, restockingFee: { required: false, type: () => Number, minimum: 0 }, refundMethod: { required: false, type: () => Object }, returnPolicyText: { required: false, type: () => String, minLength: 0, maxLength: 5000 }, replacementPolicyText: { required: false, type: () => String, minLength: 0, maxLength: 5000 }, preparedFoodPolicy: { required: false, type: () => Object }, allowCustomerChangedMind: { required: false, type: () => Boolean } };
    }
}
exports.ProductReturnPolicyDto = ProductReturnPolicyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ProductReturnPolicyDto.prototype, "isReturnable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ProductReturnPolicyDto.prototype, "isRefundable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ProductReturnPolicyDto.prototype, "isReplaceable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Return window in hours' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ProductReturnPolicyDto.prototype, "returnWindowHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: claim_policy_enums_1.ClaimApprovalModeEnum }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(claim_policy_enums_1.ClaimApprovalModeEnum),
    __metadata("design:type", Object)
], ProductReturnPolicyDto.prototype, "approvalMode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: claim_policy_enums_1.ClaimProofRequirementEnum }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(claim_policy_enums_1.ClaimProofRequirementEnum),
    __metadata("design:type", Object)
], ProductReturnPolicyDto.prototype, "proofRequired", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ProductReturnPolicyDto.prototype, "autoApproveBelowAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: claim_policy_enums_1.ReturnClaimReasonEnum, isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(claim_policy_enums_1.ReturnClaimReasonEnum, { each: true }),
    __metadata("design:type", Array)
], ProductReturnPolicyDto.prototype, "returnReasons", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ProductReturnPolicyDto.prototype, "restockingFee", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: claim_policy_enums_1.ClaimRefundMethodEnum }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(claim_policy_enums_1.ClaimRefundMethodEnum),
    __metadata("design:type", Object)
], ProductReturnPolicyDto.prototype, "refundMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 5000),
    __metadata("design:type", String)
], ProductReturnPolicyDto.prototype, "returnPolicyText", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 5000),
    __metadata("design:type", String)
], ProductReturnPolicyDto.prototype, "replacementPolicyText", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: claim_policy_enums_1.PreparedFoodPolicyEnum }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(claim_policy_enums_1.PreparedFoodPolicyEnum),
    __metadata("design:type", Object)
], ProductReturnPolicyDto.prototype, "preparedFoodPolicy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ProductReturnPolicyDto.prototype, "allowCustomerChangedMind", void 0);
class ApplyAiReturnPolicySuggestionDto extends ProductReturnPolicyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { confirm: { required: false, type: () => Boolean } };
    }
}
exports.ApplyAiReturnPolicySuggestionDto = ApplyAiReturnPolicySuggestionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Confirm applying AI-suggested policy' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ApplyAiReturnPolicySuggestionDto.prototype, "confirm", void 0);
//# sourceMappingURL=product-return-policy.dto.js.map