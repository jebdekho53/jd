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
exports.InitiateCheckoutDto = exports.DeliveryAddressDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const payer_contact_dto_1 = require("./payer-contact.dto");
class DeliveryAddressDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { line1: { required: true, type: () => String, minLength: 2, maxLength: 200 }, line2: { required: false, type: () => String }, city: { required: true, type: () => String }, pincode: { required: true, type: () => String, minLength: 4, maxLength: 10 }, lat: { required: true, type: () => Number }, lng: { required: true, type: () => Number }, locality: { required: false, type: () => String }, locationPincodeId: { required: false, type: () => String }, locationAreaId: { required: false, type: () => String }, locationCityId: { required: false, type: () => String } };
    }
}
exports.DeliveryAddressDto = DeliveryAddressDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '42 MG Road' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 200),
    __metadata("design:type", String)
], DeliveryAddressDto.prototype, "line1", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'Flat 3B' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeliveryAddressDto.prototype, "line2", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'New Delhi' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeliveryAddressDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '110001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(4, 10),
    __metadata("design:type", String)
], DeliveryAddressDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 28.6139 }),
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], DeliveryAddressDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 77.209 }),
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], DeliveryAddressDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeliveryAddressDto.prototype, "locality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeliveryAddressDto.prototype, "locationPincodeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeliveryAddressDto.prototype, "locationAreaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeliveryAddressDto.prototype, "locationCityId", void 0);
class InitiateCheckoutDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { deliveryAddress: { required: true, type: () => require("./initiate-checkout.dto").DeliveryAddressDto }, buyerNote: { required: false, type: () => String, minLength: 0, maxLength: 300 }, walletAmountToUse: { required: false, type: () => Number }, rewardPointsToRedeem: { required: false, type: () => Number }, referralCode: { required: false, type: () => String }, deviceFingerprint: { required: false, type: () => String }, corporatePurchaseRequestId: { required: false, type: () => String }, payerContact: { required: false, type: () => require("./payer-contact.dto").PayerContactDto } };
    }
}
exports.InitiateCheckoutDto = InitiateCheckoutDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: DeliveryAddressDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DeliveryAddressDto),
    __metadata("design:type", DeliveryAddressDto)
], InitiateCheckoutDto.prototype, "deliveryAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'Please ring the bell' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 300),
    __metadata("design:type", String)
], InitiateCheckoutDto.prototype, "buyerNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], InitiateCheckoutDto.prototype, "walletAmountToUse", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], InitiateCheckoutDto.prototype, "rewardPointsToRedeem", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitiateCheckoutDto.prototype, "referralCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitiateCheckoutDto.prototype, "deviceFingerprint", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Approved corporate purchase request id' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitiateCheckoutDto.prototype, "corporatePurchaseRequestId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: payer_contact_dto_1.PayerContactDto, required: false, description: 'Required for Razorpay prefill and receipts' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => payer_contact_dto_1.PayerContactDto),
    __metadata("design:type", payer_contact_dto_1.PayerContactDto)
], InitiateCheckoutDto.prototype, "payerContact", void 0);
//# sourceMappingURL=initiate-checkout.dto.js.map