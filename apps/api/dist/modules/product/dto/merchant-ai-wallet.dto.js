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
exports.AdminAdjustAiWalletDto = exports.VerifyAiWalletRechargeDto = exports.CreateAiWalletRechargeDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateAiWalletRechargeDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { amountPaise: { required: true, type: () => Number, minimum: 10000 } };
    }
}
exports.CreateAiWalletRechargeDto = CreateAiWalletRechargeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10000, description: 'Amount in paise (minimum ₹100)' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(10000),
    __metadata("design:type", Number)
], CreateAiWalletRechargeDto.prototype, "amountPaise", void 0);
class VerifyAiWalletRechargeDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { razorpayOrderId: { required: true, type: () => String }, razorpayPaymentId: { required: true, type: () => String }, razorpaySignature: { required: true, type: () => String } };
    }
}
exports.VerifyAiWalletRechargeDto = VerifyAiWalletRechargeDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyAiWalletRechargeDto.prototype, "razorpayOrderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyAiWalletRechargeDto.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyAiWalletRechargeDto.prototype, "razorpaySignature", void 0);
class AdminAdjustAiWalletDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { amountPaise: { required: true, type: () => Number }, reason: { required: true, type: () => String } };
    }
}
exports.AdminAdjustAiWalletDto = AdminAdjustAiWalletDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Positive to credit, negative to debit' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AdminAdjustAiWalletDto.prototype, "amountPaise", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminAdjustAiWalletDto.prototype, "reason", void 0);
//# sourceMappingURL=merchant-ai-wallet.dto.js.map