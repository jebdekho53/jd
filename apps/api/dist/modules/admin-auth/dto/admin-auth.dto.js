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
exports.AdminLogoutDto = exports.UpdateAdminSettingsDto = exports.AdminChangePasswordDto = exports.AdminResetPasswordDto = exports.AdminForgotPasswordDto = exports.AdminLoginDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AdminLoginDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: true, type: () => String }, password: { required: true, type: () => String, minLength: 8 }, rememberMe: { required: false, type: () => Boolean }, deviceName: { required: false, type: () => String } };
    }
}
exports.AdminLoginDto = AdminLoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'admin@jebdekho.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], AdminLoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], AdminLoginDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdminLoginDto.prototype, "rememberMe", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminLoginDto.prototype, "deviceName", void 0);
class AdminForgotPasswordDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: true, type: () => String } };
    }
}
exports.AdminForgotPasswordDto = AdminForgotPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], AdminForgotPasswordDto.prototype, "email", void 0);
class AdminResetPasswordDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { token: { required: true, type: () => String, minLength: 32, maxLength: 128 }, newPassword: { required: true, type: () => String, minLength: 8 } };
    }
}
exports.AdminResetPasswordDto = AdminResetPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(32, 128),
    __metadata("design:type", String)
], AdminResetPasswordDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], AdminResetPasswordDto.prototype, "newPassword", void 0);
class AdminChangePasswordDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { currentPassword: { required: true, type: () => String }, newPassword: { required: true, type: () => String, minLength: 8 } };
    }
}
exports.AdminChangePasswordDto = AdminChangePasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], AdminChangePasswordDto.prototype, "newPassword", void 0);
class UpdateAdminSettingsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: false, type: () => String, minLength: 2, maxLength: 100 }, email: { required: false, type: () => String }, phone: { required: false, type: () => String, minLength: 10, maxLength: 15 } };
    }
}
exports.UpdateAdminSettingsDto = UpdateAdminSettingsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], UpdateAdminSettingsDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateAdminSettingsDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 15),
    __metadata("design:type", String)
], UpdateAdminSettingsDto.prototype, "phone", void 0);
class AdminLogoutDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { refreshToken: { required: false, type: () => String } };
    }
}
exports.AdminLogoutDto = AdminLogoutDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminLogoutDto.prototype, "refreshToken", void 0);
//# sourceMappingURL=admin-auth.dto.js.map