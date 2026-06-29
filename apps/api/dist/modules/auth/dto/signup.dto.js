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
exports.MobileSignupRequestOtpDto = exports.EmailSignupDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const constants_1 = require("../../../common/constants");
class EmailSignupDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 2 }, email: { required: true, type: () => String }, password: { required: true, type: () => String, minLength: 8 }, referralCode: { required: false, type: () => String }, deviceId: { required: false, type: () => String }, deviceName: { required: false, type: () => String } };
    }
}
exports.EmailSignupDto = EmailSignupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rahul Sharma' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], EmailSignupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'rahul@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], EmailSignupDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SecurePass123!' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], EmailSignupDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmailSignupDto.prototype, "referralCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmailSignupDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmailSignupDto.prototype, "deviceName", void 0);
class MobileSignupRequestOtpDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 2 }, phone: { required: true, type: () => String, pattern: "PHONE_E164_REGEX" }, referralCode: { required: false, type: () => String }, deviceId: { required: false, type: () => String }, deviceName: { required: false, type: () => String } };
    }
}
exports.MobileSignupRequestOtpDto = MobileSignupRequestOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rahul Sharma' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], MobileSignupRequestOtpDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210' }),
    (0, class_validator_1.Matches)(constants_1.PHONE_E164_REGEX, { message: 'Phone must be in E.164 format' }),
    __metadata("design:type", String)
], MobileSignupRequestOtpDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MobileSignupRequestOtpDto.prototype, "referralCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MobileSignupRequestOtpDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MobileSignupRequestOtpDto.prototype, "deviceName", void 0);
//# sourceMappingURL=signup.dto.js.map