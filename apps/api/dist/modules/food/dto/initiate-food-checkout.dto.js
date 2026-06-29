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
exports.InitiateFoodCheckoutDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class InitiateFoodCheckoutDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { deliveryAddress: { required: true, type: () => Object }, deliveryLat: { required: true, type: () => Number }, deliveryLng: { required: true, type: () => Number }, paymentMethod: { required: true, type: () => Object }, tipAmount: { required: false, type: () => Number, minimum: 0 }, couponDiscount: { required: false, type: () => Number, minimum: 0 }, scheduledDeliveryAt: { required: false, type: () => String }, specialInstructions: { required: false, type: () => String }, restaurantNote: { required: false, type: () => String } };
    }
}
exports.InitiateFoodCheckoutDto = InitiateFoodCheckoutDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], InitiateFoodCheckoutDto.prototype, "deliveryAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InitiateFoodCheckoutDto.prototype, "deliveryLat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InitiateFoodCheckoutDto.prototype, "deliveryLng", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.PaymentMethod }),
    (0, class_validator_1.IsEnum)(client_1.PaymentMethod),
    __metadata("design:type", String)
], InitiateFoodCheckoutDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], InitiateFoodCheckoutDto.prototype, "tipAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], InitiateFoodCheckoutDto.prototype, "couponDiscount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitiateFoodCheckoutDto.prototype, "scheduledDeliveryAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitiateFoodCheckoutDto.prototype, "specialInstructions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitiateFoodCheckoutDto.prototype, "restaurantNote", void 0);
//# sourceMappingURL=initiate-food-checkout.dto.js.map