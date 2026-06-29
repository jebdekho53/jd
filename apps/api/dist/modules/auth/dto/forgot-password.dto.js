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
exports.ForgotPasswordDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const constants_1 = require("../../../common/constants");
class ForgotPasswordDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: false, type: () => String }, phone: { required: false, type: () => String, pattern: "PHONE_E164_REGEX" } };
    }
}
exports.ForgotPasswordDto = ForgotPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'rahul@example.com' }),
    (0, class_validator_1.ValidateIf)((o) => !o.phone),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: '+919876543210' }),
    (0, class_validator_1.ValidateIf)((o) => !o.email),
    (0, class_validator_1.Matches)(constants_1.PHONE_E164_REGEX, { message: 'Phone must be in E.164 format' }),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "phone", void 0);
//# sourceMappingURL=forgot-password.dto.js.map