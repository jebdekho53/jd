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
exports.UpdateFoodCartItemDto = exports.AddFoodCartItemDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class AddFoodCartItemDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { menuItemId: { required: true, type: () => String }, variantId: { required: false, type: () => String }, comboId: { required: false, type: () => String }, quantity: { required: false, type: () => Number, minimum: 1 }, addonIds: { required: false, type: () => [String] }, specialInstructions: { required: false, type: () => String } };
    }
}
exports.AddFoodCartItemDto = AddFoodCartItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddFoodCartItemDto.prototype, "menuItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddFoodCartItemDto.prototype, "variantId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddFoodCartItemDto.prototype, "comboId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AddFoodCartItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AddFoodCartItemDto.prototype, "addonIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddFoodCartItemDto.prototype, "specialInstructions", void 0);
class UpdateFoodCartItemDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { quantity: { required: true, type: () => Number, minimum: 0 } };
    }
}
exports.UpdateFoodCartItemDto = UpdateFoodCartItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateFoodCartItemDto.prototype, "quantity", void 0);
//# sourceMappingURL=add-food-cart-item.dto.js.map