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
exports.PayerContactDto = void 0;
exports.normalizePayerPhone = normalizePayerPhone;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class PayerContactDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 2, maxLength: 100 }, email: { required: true, type: () => String }, phone: { required: true, type: () => String, pattern: "/^[6-9]\\d{9}$/" } };
    }
}
exports.PayerContactDto = PayerContactDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rahul Seth' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], PayerContactDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'rahul@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], PayerContactDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9876543210', description: '10-digit Indian mobile number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[6-9]\d{9}$/, { message: 'phone must be a valid 10-digit Indian mobile number' }),
    __metadata("design:type", String)
], PayerContactDto.prototype, "phone", void 0);
function normalizePayerPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91'))
        return digits.slice(2);
    if (digits.length === 10)
        return digits;
    return digits.slice(-10);
}
//# sourceMappingURL=payer-contact.dto.js.map