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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMenuCategoryDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateMenuCategoryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { platformCategoryId: { required: true, type: () => String }, name: { required: false, type: () => String }, slug: { required: false, type: () => String }, categorySlug: { required: false, type: () => Object }, description: { required: false, type: () => String }, imageUrl: { required: false, type: () => String }, sortOrder: { required: false, type: () => Number, minimum: 0 } };
    }
}
exports.CreateMenuCategoryDto = CreateMenuCategoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Approved platform menu subcategory id' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMenuCategoryDto.prototype, "platformCategoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional display name override (defaults to platform name)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMenuCategoryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMenuCategoryDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.MenuCategorySlug }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.MenuCategorySlug),
    __metadata("design:type", typeof (_a = typeof client_1.MenuCategorySlug !== "undefined" && client_1.MenuCategorySlug) === "function" ? _a : Object)
], CreateMenuCategoryDto.prototype, "categorySlug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMenuCategoryDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMenuCategoryDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateMenuCategoryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=create-menu-category.dto.js.map