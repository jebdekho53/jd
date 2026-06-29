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
exports.NetworkQueryDto = exports.CreateTransferDto = exports.TransferItemDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class TransferItemDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { variantId: { required: true, type: () => String }, sku: { required: true, type: () => String }, quantity: { required: true, type: () => Number, minimum: 1 } };
    }
}
exports.TransferItemDto = TransferItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferItemDto.prototype, "variantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferItemDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], TransferItemDto.prototype, "quantity", void 0);
class CreateTransferDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { fromStoreId: { required: true, type: () => String }, toStoreId: { required: true, type: () => String }, notes: { required: false, type: () => String }, items: { required: true, type: () => [require("./fulfillment.dto").TransferItemDto] } };
    }
}
exports.CreateTransferDto = CreateTransferDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransferDto.prototype, "fromStoreId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransferDto.prototype, "toStoreId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransferDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TransferItemDto),
    __metadata("design:type", Array)
], CreateTransferDto.prototype, "items", void 0);
class NetworkQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { storeId: { required: false, type: () => String } };
    }
}
exports.NetworkQueryDto = NetworkQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NetworkQueryDto.prototype, "storeId", void 0);
//# sourceMappingURL=fulfillment.dto.js.map