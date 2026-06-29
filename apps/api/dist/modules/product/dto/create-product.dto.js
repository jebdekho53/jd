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
exports.CreateProductDto = exports.CreateVariantDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const claim_policy_enums_1 = require("../../../common/constants/claim-policy.enums");
const SKU_REGEX = /^[A-Za-z0-9_-]{2,50}$/;
class CreateVariantDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { sku: { required: true, type: () => String, pattern: "SKU_REGEX" }, name: { required: true, type: () => String, minLength: 1, maxLength: 100 }, price: { required: true, type: () => Number, minimum: 0 }, mrp: { required: false, type: () => Number, minimum: 0 }, weightGrams: { required: false, type: () => Number, minimum: 1 }, quantity: { required: false, type: () => Number, minimum: 0 }, lowStockThreshold: { required: false, type: () => Number, minimum: 0 }, isDefault: { required: false, type: () => Boolean } };
    }
}
exports.CreateVariantDto = CreateVariantDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SKU-500G', description: 'Unique SKU within this store' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(SKU_REGEX, { message: 'SKU must be 2-50 alphanumeric characters, dashes, or underscores' }),
    __metadata("design:type", String)
], CreateVariantDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '500g', description: 'Human-readable variant name (e.g. 500g, 1kg)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], CreateVariantDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 49.0, description: 'Selling price (must be ≤ mrp)' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateVariantDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 59.0, description: 'Maximum retail price' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateVariantDto.prototype, "mrp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 500, description: 'Weight in grams' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateVariantDto.prototype, "weightGrams", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 0, description: 'Initial stock quantity' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateVariantDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 5, description: 'Low-stock alert threshold' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateVariantDto.prototype, "lowStockThreshold", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateVariantDto.prototype, "isDefault", void 0);
class CreateProductDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 2, maxLength: 200 }, description: { required: false, type: () => String, minLength: 0, maxLength: 2000 }, brand: { required: false, type: () => String, minLength: 1, maxLength: 100 }, sku: { required: false, type: () => String, pattern: "SKU_REGEX" }, categoryId: { required: false, type: () => String }, imageUrls: { required: true, type: () => [String] }, basePrice: { required: true, type: () => Number, minimum: 0 }, mrp: { required: false, type: () => Number, minimum: 0 }, unit: { required: false, type: () => String, minLength: 1, maxLength: 30 }, weightGrams: { required: false, type: () => Number, minimum: 1 }, isVeg: { required: false, type: () => Boolean }, tags: { required: false, type: () => [String] }, sortOrder: { required: false, type: () => Number, minimum: 0 }, quantity: { required: false, type: () => Number, minimum: 0 }, lowStockThreshold: { required: false, type: () => Number, minimum: 0 }, variants: { required: false, type: () => [require("./create-product.dto").CreateVariantDto] }, ingredients: { required: false, type: () => String }, shelfLife: { required: false, type: () => String }, countryOfOrigin: { required: false, type: () => String }, manufacturerName: { required: false, type: () => String }, manufacturerAddress: { required: false, type: () => String }, fssaiLicense: { required: false, type: () => String }, storageInstructions: { required: false, type: () => String }, disclaimer: { required: false, type: () => String }, taxInclusive: { required: false, type: () => Boolean }, hsnCodeId: { required: false, type: () => String }, gstSlab: { required: false, type: () => Object }, taxCategory: { required: false, type: () => Object }, isReturnable: { required: false, type: () => Boolean }, isRefundable: { required: false, type: () => Boolean }, isReplaceable: { required: false, type: () => Boolean }, returnWindowHours: { required: false, type: () => Number, minimum: 1 }, approvalMode: { required: false, type: () => Object }, proofRequired: { required: false, type: () => Object }, autoApproveBelowAmount: { required: false, type: () => Number, minimum: 0 }, returnReasons: { required: false, type: () => [Object] }, restockingFee: { required: false, type: () => Number, minimum: 0 }, refundMethod: { required: false, type: () => Object }, returnPolicyText: { required: false, type: () => String, minLength: 0, maxLength: 5000 }, replacementPolicyText: { required: false, type: () => String, minLength: 0, maxLength: 5000 }, preparedFoodPolicy: { required: false, type: () => Object }, allowCustomerChangedMind: { required: false, type: () => Boolean } };
    }
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Amul Full Cream Milk' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 200),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'Fresh full cream milk from Amul' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], CreateProductDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'Amul' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], CreateProductDto.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'AMUL-MILK-500', description: 'Master SKU (optional)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(SKU_REGEX, { message: 'SKU must be alphanumeric, dashes, or underscores' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Category ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['https://cdn.example.com/milk.png'], type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'At least one product image is required' }),
    (0, class_validator_1.ArrayMaxSize)(5),
    (0, class_validator_1.IsUrl)({}, { each: true }),
    __metadata("design:type", Array)
], CreateProductDto.prototype, "imageUrls", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 49.0, description: 'Base selling price (must be ≤ mrp if set)' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "basePrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 59.0, description: 'MRP for the default variant' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "mrp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'piece', description: 'Unit (piece, kg, litre, pack…)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 30),
    __metadata("design:type", String)
], CreateProductDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 500, description: 'Weight in grams' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "weightGrams", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: true, description: 'true=veg, false=non-veg, null=N/A' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isVeg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: ['dairy', 'milk', 'amul'], type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateProductDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 10, description: 'Initial stock for default variant' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 5, description: 'Low-stock threshold for default variant' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "lowStockThreshold", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        type: [CreateVariantDto],
        description: 'Additional variants beyond the default. Leave empty for single-variant products.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateVariantDto),
    __metadata("design:type", Array)
], CreateProductDto.prototype, "variants", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "ingredients", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "shelfLife", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "countryOfOrigin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "manufacturerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "manufacturerAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "fssaiLicense", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "storageInstructions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "disclaimer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "taxInclusive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'HSN code reference ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "hsnCodeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: client_1.GstSlab }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.GstSlab),
    __metadata("design:type", String)
], CreateProductDto.prototype, "gstSlab", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['GOODS', 'SERVICES', 'EXEMPT', 'NIL_RATED'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['GOODS', 'SERVICES', 'EXEMPT', 'NIL_RATED']),
    __metadata("design:type", String)
], CreateProductDto.prototype, "taxCategory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isReturnable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isRefundable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isReplaceable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Return window in hours' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "returnWindowHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: claim_policy_enums_1.ClaimApprovalModeEnum }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(claim_policy_enums_1.ClaimApprovalModeEnum),
    __metadata("design:type", String)
], CreateProductDto.prototype, "approvalMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: claim_policy_enums_1.ClaimProofRequirementEnum }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(claim_policy_enums_1.ClaimProofRequirementEnum),
    __metadata("design:type", String)
], CreateProductDto.prototype, "proofRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "autoApproveBelowAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: claim_policy_enums_1.ReturnClaimReasonEnum, isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(claim_policy_enums_1.ReturnClaimReasonEnum, { each: true }),
    __metadata("design:type", Array)
], CreateProductDto.prototype, "returnReasons", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "restockingFee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: claim_policy_enums_1.ClaimRefundMethodEnum }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(claim_policy_enums_1.ClaimRefundMethodEnum),
    __metadata("design:type", String)
], CreateProductDto.prototype, "refundMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 5000),
    __metadata("design:type", String)
], CreateProductDto.prototype, "returnPolicyText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 5000),
    __metadata("design:type", String)
], CreateProductDto.prototype, "replacementPolicyText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: claim_policy_enums_1.PreparedFoodPolicyEnum }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(claim_policy_enums_1.PreparedFoodPolicyEnum),
    __metadata("design:type", String)
], CreateProductDto.prototype, "preparedFoodPolicy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "allowCustomerChangedMind", void 0);
//# sourceMappingURL=create-product.dto.js.map