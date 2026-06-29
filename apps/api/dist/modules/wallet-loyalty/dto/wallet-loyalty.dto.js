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
exports.ResolveFraudReviewDto = exports.UpdateRewardConfigDto = exports.AdminAdjustPointsDto = exports.AdminAdjustWalletDto = exports.CheckoutWalletDto = exports.ApplyReferralDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class ApplyReferralDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { code: { required: true, type: () => String, minLength: 4, maxLength: 20 }, deviceFingerprint: { required: false, type: () => String } };
    }
}
exports.ApplyReferralDto = ApplyReferralDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(4, 20),
    __metadata("design:type", String)
], ApplyReferralDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplyReferralDto.prototype, "deviceFingerprint", void 0);
class CheckoutWalletDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { walletAmountToUse: { required: false, type: () => Number, minimum: 0 }, rewardPointsToRedeem: { required: false, type: () => Number, minimum: 0 }, referralCode: { required: false, type: () => String }, deviceFingerprint: { required: false, type: () => String } };
    }
}
exports.CheckoutWalletDto = CheckoutWalletDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Amount to pay from wallet' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CheckoutWalletDto.prototype, "walletAmountToUse", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Reward points to redeem' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CheckoutWalletDto.prototype, "rewardPointsToRedeem", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckoutWalletDto.prototype, "referralCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckoutWalletDto.prototype, "deviceFingerprint", void 0);
class AdminAdjustWalletDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { amount: { required: true, type: () => Number }, reason: { required: true, type: () => String } };
    }
}
exports.AdminAdjustWalletDto = AdminAdjustWalletDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AdminAdjustWalletDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminAdjustWalletDto.prototype, "reason", void 0);
class AdminAdjustPointsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { points: { required: true, type: () => Number }, reason: { required: true, type: () => String } };
    }
}
exports.AdminAdjustPointsDto = AdminAdjustPointsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AdminAdjustPointsDto.prototype, "points", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminAdjustPointsDto.prototype, "reason", void 0);
class UpdateRewardConfigDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { value: { required: true, type: () => Object } };
    }
}
exports.UpdateRewardConfigDto = UpdateRewardConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], UpdateRewardConfigDto.prototype, "value", void 0);
class ResolveFraudReviewDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { approve: { required: true, type: () => Boolean } };
    }
}
exports.ResolveFraudReviewDto = ResolveFraudReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ResolveFraudReviewDto.prototype, "approve", void 0);
//# sourceMappingURL=wallet-loyalty.dto.js.map