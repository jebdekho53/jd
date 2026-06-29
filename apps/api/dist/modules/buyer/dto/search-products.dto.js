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
exports.SearchProductsDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class SearchProductsDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { q: { required: false, type: () => String, minLength: 1, maxLength: 100 }, categoryId: { required: false, type: () => String }, subcategoryId: { required: false, type: () => String }, storeId: { required: false, type: () => String }, lat: { required: false, type: () => Number }, lng: { required: false, type: () => Number }, pincode: { required: false, type: () => String, minLength: 6, maxLength: 6 }, minPrice: { required: false, type: () => Number, minimum: 0 }, maxPrice: { required: false, type: () => Number }, sort: { required: false, type: () => String, enum: ['relevance', 'distance', 'price_low_high', 'price_high_low', 'rating', 'fastest_delivery'] }, page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1, maximum: 50 } };
    }
}
exports.SearchProductsDto = SearchProductsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'amul milk', description: 'Search term' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Narrow results to a category' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Narrow results to a subcategory' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "subcategoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Narrow results to a specific store' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value != null ? parseFloat(value) : undefined)),
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], SearchProductsDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value != null ? parseFloat(value) : undefined)),
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], SearchProductsDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: '201017', description: 'Buyer pincode for delivery coverage' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value != null ? parseFloat(value) : undefined)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SearchProductsDto.prototype, "minPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value != null ? parseFloat(value) : undefined)),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SearchProductsDto.prototype, "maxPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        enum: ['relevance', 'distance', 'price_low_high', 'price_high_low', 'rating', 'fastest_delivery'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['relevance', 'distance', 'price_low_high', 'price_high_low', 'rating', 'fastest_delivery']),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "sort", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SearchProductsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], SearchProductsDto.prototype, "limit", void 0);
//# sourceMappingURL=search-products.dto.js.map