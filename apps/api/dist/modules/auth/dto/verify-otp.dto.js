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
exports.VerifyOtpDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const constants_1 = require("../../../common/constants");
class VerifyOtpDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { phone: { required: true, type: () => String, pattern: "PHONE_E164_REGEX" }, code: { required: true, type: () => String, minLength: 4, maxLength: 8 }, deviceId: { required: false, type: () => String }, deviceName: { required: false, type: () => String }, name: { required: false, type: () => String }, referralCode: { required: false, type: () => String } };
    }
}
exports.VerifyOtpDto = VerifyOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210' }),
    (0, class_validator_1.Matches)(constants_1.PHONE_E164_REGEX, {
        message: 'Phone must be in E.164 format',
    }),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456', description: '6-digit OTP code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(4, 8),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "deviceName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Display name for new signups' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "referralCode", void 0);
//# sourceMappingURL=verify-otp.dto.js.map