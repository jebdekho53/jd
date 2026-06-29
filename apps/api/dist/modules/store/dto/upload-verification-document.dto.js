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
exports.UploadVerificationDocumentDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class UploadVerificationDocumentDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { documentType: { required: true, type: () => Object }, fileName: { required: true, type: () => String, minLength: 1, maxLength: 255 }, mimeType: { required: true, type: () => String, minLength: 3, maxLength: 100 }, fileUrl: { required: true, type: () => String, minLength: 10, maxLength: 5000000 } };
    }
}
exports.UploadVerificationDocumentDto = UploadVerificationDocumentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.StoreDocumentType }),
    (0, class_validator_1.IsEnum)(client_1.StoreDocumentType),
    __metadata("design:type", String)
], UploadVerificationDocumentDto.prototype, "documentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Original file name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UploadVerificationDocumentDto.prototype, "fileName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'MIME type, e.g. image/jpeg or application/pdf' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UploadVerificationDocumentDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Base64 data URL or file URL' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(5_000_000),
    __metadata("design:type", String)
], UploadVerificationDocumentDto.prototype, "fileUrl", void 0);
//# sourceMappingURL=upload-verification-document.dto.js.map