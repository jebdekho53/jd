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
exports.ShipVendorOrderDto = exports.CreateVendorProductDto = exports.CreateVendorOrderDto = exports.UpdateCartDto = exports.AddCartItemDto = exports.ProcurementQueryDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ProcurementQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { storeId: { required: false, type: () => String }, q: { required: false, type: () => String }, vendorType: { required: false, type: () => String }, moqMax: { required: false, type: () => Number, minimum: 1 }, gstRate: { required: false, type: () => String } };
    }
}
exports.ProcurementQueryDto = ProcurementQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcurementQueryDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcurementQueryDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcurementQueryDto.prototype, "vendorType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ProcurementQueryDto.prototype, "moqMax", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcurementQueryDto.prototype, "gstRate", void 0);
class AddCartItemDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { vendorProductId: { required: true, type: () => String }, quantity: { required: true, type: () => Number, minimum: 1 } };
    }
}
exports.AddCartItemDto = AddCartItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddCartItemDto.prototype, "vendorProductId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AddCartItemDto.prototype, "quantity", void 0);
class UpdateCartDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { items: { required: true, type: () => [require("./procurement.dto").AddCartItemDto] }, vendorId: { required: false, type: () => String }, storeId: { required: false, type: () => String } };
    }
}
exports.UpdateCartDto = UpdateCartDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AddCartItemDto),
    __metadata("design:type", Array)
], UpdateCartDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCartDto.prototype, "vendorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCartDto.prototype, "storeId", void 0);
class CreateVendorOrderDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { storeId: { required: false, type: () => String }, notes: { required: false, type: () => String }, useCredit: { required: false, type: () => Boolean } };
    }
}
exports.CreateVendorOrderDto = CreateVendorOrderDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVendorOrderDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVendorOrderDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateVendorOrderDto.prototype, "useCredit", void 0);
class CreateVendorProductDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { catalogId: { required: true, type: () => String }, name: { required: true, type: () => String }, sku: { required: true, type: () => String }, description: { required: false, type: () => String }, category: { required: false, type: () => String }, hsnCode: { required: false, type: () => String }, gstRate: { required: false, type: () => Number }, basePrice: { required: true, type: () => Number }, moq: { required: false, type: () => Number, minimum: 1 }, leadTimeDays: { required: false, type: () => Number }, availableQty: { required: false, type: () => Number, minimum: 0 } };
    }
}
exports.CreateVendorProductDto = CreateVendorProductDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVendorProductDto.prototype, "catalogId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVendorProductDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVendorProductDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVendorProductDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVendorProductDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVendorProductDto.prototype, "hsnCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateVendorProductDto.prototype, "gstRate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateVendorProductDto.prototype, "moq", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateVendorProductDto.prototype, "leadTimeDays", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateVendorProductDto.prototype, "availableQty", void 0);
class ShipVendorOrderDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { carrier: { required: false, type: () => String }, trackingNumber: { required: false, type: () => String } };
    }
}
exports.ShipVendorOrderDto = ShipVendorOrderDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShipVendorOrderDto.prototype, "carrier", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShipVendorOrderDto.prototype, "trackingNumber", void 0);
//# sourceMappingURL=procurement.dto.js.map