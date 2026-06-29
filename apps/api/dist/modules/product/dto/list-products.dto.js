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
exports.ListProductsDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ListProductsDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { categoryId: { required: false, type: () => String }, isActive: { required: false, type: () => Boolean }, search: { required: false, type: () => String }, page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1, maximum: 100 } };
    }
}
exports.ListProductsDto = ListProductsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Filter by category ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListProductsDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Filter by active status (true/false)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ListProductsDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Search by name (partial, case-insensitive)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListProductsDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListProductsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ListProductsDto.prototype, "limit", void 0);
//# sourceMappingURL=list-products.dto.js.map