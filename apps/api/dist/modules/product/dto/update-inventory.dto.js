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
exports.UpdateInventoryDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateInventoryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { quantity: { required: true, type: () => Number, minimum: 0 }, lowStockThreshold: { required: false, type: () => Number, minimum: 0 } };
    }
}
exports.UpdateInventoryDto = UpdateInventoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 50,
        description: 'New absolute quantity (not a delta — replaces current stock)',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0, { message: 'Inventory quantity cannot be negative' }),
    __metadata("design:type", Number)
], UpdateInventoryDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 5, description: 'Low-stock alert threshold' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateInventoryDto.prototype, "lowStockThreshold", void 0);
//# sourceMappingURL=update-inventory.dto.js.map