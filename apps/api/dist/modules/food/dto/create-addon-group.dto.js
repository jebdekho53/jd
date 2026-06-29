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
exports.CreateAddonGroupDto = exports.AddonDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class AddonDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, price: { required: false, type: () => Number, minimum: 0 }, dietType: { required: false, type: () => Object } };
    }
}
exports.AddonDto = AddonDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddonDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AddonDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.DietType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.DietType),
    __metadata("design:type", String)
], AddonDto.prototype, "dietType", void 0);
class CreateAddonGroupDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, selectionType: { required: false, type: () => Object }, isRequired: { required: false, type: () => Boolean }, minSelections: { required: false, type: () => Number }, maxSelections: { required: false, type: () => Number }, sortOrder: { required: false, type: () => Number }, addons: { required: false, type: () => [require("./create-addon-group.dto").AddonDto] } };
    }
}
exports.CreateAddonGroupDto = CreateAddonGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAddonGroupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.AddonSelectionType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.AddonSelectionType),
    __metadata("design:type", String)
], CreateAddonGroupDto.prototype, "selectionType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAddonGroupDto.prototype, "isRequired", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAddonGroupDto.prototype, "minSelections", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAddonGroupDto.prototype, "maxSelections", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAddonGroupDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [AddonDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AddonDto),
    __metadata("design:type", Array)
], CreateAddonGroupDto.prototype, "addons", void 0);
//# sourceMappingURL=create-addon-group.dto.js.map