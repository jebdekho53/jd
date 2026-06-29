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
exports.RejectStoreDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class RejectStoreDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String, minLength: 10, maxLength: 500 }, rejectionType: { required: true, type: () => Object } };
    }
}
exports.RejectStoreDto = RejectStoreDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'GST certificate is expired. Please upload a valid document.',
        description: 'Reason shown to the merchant',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 500),
    __metadata("design:type", String)
], RejectStoreDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.RejectionType,
        example: client_1.RejectionType.DOCUMENT_ISSUE,
        description: 'DOCUMENT_ISSUE and COMPLIANCE_ISSUE are revocable. ' +
            'FRAUD, DUPLICATE_ACCOUNT, and POLICY_VIOLATION permanently blacklist the merchant.',
    }),
    (0, class_validator_1.IsEnum)(client_1.RejectionType),
    __metadata("design:type", String)
], RejectStoreDto.prototype, "rejectionType", void 0);
//# sourceMappingURL=reject-store.dto.js.map