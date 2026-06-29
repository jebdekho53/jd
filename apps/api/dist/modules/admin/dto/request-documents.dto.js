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
exports.RequestDocumentsDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class RequestDocumentsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String, minLength: 10, maxLength: 2000 }, documentTypes: { required: true, type: () => [Object] } };
    }
}
exports.RequestDocumentsDto = RequestDocumentsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message to merchant explaining what documents are needed',
        example: 'Please upload GST certificate, PAN card, and FSSAI license.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], RequestDocumentsDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.StoreDocumentType,
        isArray: true,
        example: [client_1.StoreDocumentType.GST_CERTIFICATE, client_1.StoreDocumentType.PAN_CARD],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsEnum)(client_1.StoreDocumentType, { each: true }),
    __metadata("design:type", Array)
], RequestDocumentsDto.prototype, "documentTypes", void 0);
//# sourceMappingURL=request-documents.dto.js.map