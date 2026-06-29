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
exports.CreateMerchantProfileDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
class CreateMerchantProfileDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { businessName: { required: true, type: () => String, minLength: 2, maxLength: 100 }, gstNumber: { required: false, type: () => String, pattern: "GST_REGEX" }, panNumber: { required: true, type: () => String, pattern: "PAN_REGEX" } };
    }
}
exports.CreateMerchantProfileDto = CreateMerchantProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Sharma General Store' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], CreateMerchantProfileDto.prototype, "businessName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '07AAGCR2206E1ZN', description: 'GSTIN — optional at signup' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(GST_REGEX, { message: 'Invalid GST number format (15-char GSTIN)' }),
    __metadata("design:type", String)
], CreateMerchantProfileDto.prototype, "gstNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'AAGCR2206E', description: 'PAN — required for billing & compliance' }),
    (0, class_validator_1.Matches)(PAN_REGEX, { message: 'Invalid PAN number format' }),
    __metadata("design:type", String)
], CreateMerchantProfileDto.prototype, "panNumber", void 0);
//# sourceMappingURL=create-merchant-profile.dto.js.map