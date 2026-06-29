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
exports.RequestOtpDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const constants_1 = require("../../../common/constants");
class RequestOtpDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { phone: { required: false, type: () => String, pattern: "PHONE_E164_REGEX" }, email: { required: false, type: () => String }, deviceId: { required: false, type: () => String }, deviceName: { required: false, type: () => String } };
    }
}
exports.RequestOtpDto = RequestOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Phone number in E.164 format',
        example: '+919876543210',
        required: false,
    }),
    (0, class_validator_1.ValidateIf)((o) => !o.email),
    (0, class_validator_1.Matches)(constants_1.PHONE_E164_REGEX, {
        message: 'Phone must be in E.164 format (e.g. +919876543210)',
    }),
    __metadata("design:type", String)
], RequestOtpDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Registered email — OTP is sent to the linked mobile number',
        example: 'merchant@demo.jebdekho.com',
        required: false,
    }),
    (0, class_validator_1.ValidateIf)((o) => !o.phone),
    (0, class_validator_1.IsEmail)({}, { message: 'Enter a valid email address' }),
    __metadata("design:type", String)
], RequestOtpDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Device ID for session tracking' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestOtpDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Human-readable device name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestOtpDto.prototype, "deviceName", void 0);
//# sourceMappingURL=request-otp.dto.js.map