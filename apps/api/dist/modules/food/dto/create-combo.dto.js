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
exports.CreateComboDto = exports.ComboItemDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class ComboItemDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { menuItemId: { required: true, type: () => String }, quantity: { required: false, type: () => Number, minimum: 1 } };
    }
}
exports.ComboItemDto = ComboItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComboItemDto.prototype, "menuItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ComboItemDto.prototype, "quantity", void 0);
class CreateComboDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, slug: { required: false, type: () => String }, description: { required: false, type: () => String }, imageUrl: { required: false, type: () => String }, comboPrice: { required: true, type: () => Number, minimum: 0 }, sortOrder: { required: false, type: () => Number }, items: { required: true, type: () => [require("./create-combo.dto").ComboItemDto] } };
    }
}
exports.CreateComboDto = CreateComboDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComboDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComboDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComboDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComboDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateComboDto.prototype, "comboPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateComboDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ComboItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ComboItemDto),
    __metadata("design:type", Array)
], CreateComboDto.prototype, "items", void 0);
//# sourceMappingURL=create-combo.dto.js.map