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
exports.ListAiHistoryDto = exports.ConfirmAiProductDto = exports.AnalyzeProductImageDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class AnalyzeProductImageDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { dataUrl: { required: true, type: () => String, minLength: 32, maxLength: 7000000 } };
    }
}
exports.AnalyzeProductImageDto = AnalyzeProductImageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Base64 data URL of product photo (JPEG/PNG/WebP, max 5MB)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(32, 7_000_000),
    __metadata("design:type", String)
], AnalyzeProductImageDto.prototype, "dataUrl", void 0);
class ConfirmAiProductDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 2, maxLength: 200 }, description: { required: false, type: () => String }, brand: { required: false, type: () => String }, sku: { required: false, type: () => String }, categoryId: { required: false, type: () => String }, basePrice: { required: true, type: () => Number, minimum: 0 }, mrp: { required: false, type: () => Number, minimum: 0 }, unit: { required: false, type: () => String }, quantity: { required: false, type: () => Number, minimum: 0 }, tags: { required: false, type: () => [String] }, ingredients: { required: false, type: () => String }, shelfLife: { required: false, type: () => String }, countryOfOrigin: { required: false, type: () => String }, manufacturerName: { required: false, type: () => String }, fssaiLicense: { required: false, type: () => String }, storageInstructions: { required: false, type: () => String }, hsnCodeId: { required: false, type: () => String }, gstSlab: { required: false, type: () => Object }, taxCategory: { required: false, type: () => Object }, confirmReturnPolicy: { required: false, type: () => Boolean }, publish: { required: true, type: () => Boolean } };
    }
}
exports.ConfirmAiProductDto = ConfirmAiProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Amul Full Cream Milk' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 200),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 49 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ConfirmAiProductDto.prototype, "basePrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ConfirmAiProductDto.prototype, "mrp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ConfirmAiProductDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ConfirmAiProductDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "ingredients", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "shelfLife", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "countryOfOrigin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "manufacturerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "fssaiLicense", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "storageInstructions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "hsnCodeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.GstSlab }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.GstSlab),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "gstSlab", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['GOODS', 'SERVICES', 'EXEMPT', 'NIL_RATED'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['GOODS', 'SERVICES', 'EXEMPT', 'NIL_RATED']),
    __metadata("design:type", String)
], ConfirmAiProductDto.prototype, "taxCategory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Apply AI-suggested return policy (merchant must opt in)',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConfirmAiProductDto.prototype, "confirmReturnPolicy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Publish immediately (true) or save as draft (false)' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConfirmAiProductDto.prototype, "publish", void 0);
class ListAiHistoryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { storeId: { required: false, type: () => String }, page: { required: false, type: () => Number, minimum: 1 }, limit: { required: false, type: () => Number, minimum: 1 } };
    }
}
exports.ListAiHistoryDto = ListAiHistoryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListAiHistoryDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListAiHistoryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListAiHistoryDto.prototype, "limit", void 0);
//# sourceMappingURL=product-ai.dto.js.map