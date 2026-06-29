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
exports.AddCartItemDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AddCartItemDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { productId: { required: true, type: () => String }, variantId: { required: true, type: () => String }, quantity: { required: true, type: () => Number, minimum: 1 } };
    }
}
exports.AddCartItemDto = AddCartItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'p-abc123', description: 'Product ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddCartItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'v-xyz456', description: 'Variant ID (must belong to the product)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddCartItemDto.prototype, "variantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2, description: 'Quantity to add (≥ 1)' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AddCartItemDto.prototype, "quantity", void 0);
//# sourceMappingURL=add-cart-item.dto.js.map