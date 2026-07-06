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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleCallDto = exports.RequestApplicationChangesDto = exports.RequestApplicationDocumentsDto = exports.RejectApplicationDto = exports.ListMerchantApplicationsDto = exports.FranchiseLeadDto = exports.ValidateGstDto = exports.SaveBankAccountDto = exports.UploadMerchantDocumentDto = exports.UpdateOnboardingStepDto = exports.PickupAddressDto = exports.ResolveStoreLocationDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
const emptyToUndefined = ({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value;
const INDIAN_PHONE_OR_E164_REGEX = /^(?:\+91)?[6-9]\d{9}$/;
class ResolveStoreLocationDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { locality: { required: false, type: () => String }, city: { required: false, type: () => String }, state: { required: false, type: () => String }, pincode: { required: false, type: () => String, pattern: "/^\\d{6}$/" }, latitude: { required: true, type: () => Number, minimum: -90, maximum: 90 }, longitude: { required: true, type: () => Number, minimum: -180, maximum: 180 }, locationCityId: { required: false, type: () => String }, locationAreaId: { required: false, type: () => String } };
    }
}
exports.ResolveStoreLocationDto = ResolveStoreLocationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveStoreLocationDto.prototype, "locality", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveStoreLocationDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveStoreLocationDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((o) => o.pincode != null),
    (0, class_validator_1.Matches)(/^\d{6}$/),
    __metadata("design:type", String)
], ResolveStoreLocationDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], ResolveStoreLocationDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], ResolveStoreLocationDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveStoreLocationDto.prototype, "locationCityId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveStoreLocationDto.prototype, "locationAreaId", void 0);
class PickupAddressDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { addressLine1: { required: true, type: () => String, minLength: 8, maxLength: 200 }, addressLine2: { required: false, type: () => String, minLength: 0, maxLength: 200 }, locality: { required: true, type: () => String, minLength: 2, maxLength: 120 }, landmark: { required: true, type: () => String, minLength: 3, maxLength: 120 }, city: { required: true, type: () => String, minLength: 2, maxLength: 100 }, state: { required: true, type: () => String, minLength: 2, maxLength: 100 }, pincode: { required: true, type: () => String, pattern: "/^\\d{6}$/" }, latitude: { required: true, type: () => Number, minimum: -90, maximum: 90 }, longitude: { required: true, type: () => Number, minimum: -180, maximum: 180 }, pickupInstructions: { required: false, type: () => String, minLength: 0, maxLength: 300 }, googlePlaceId: { required: false, type: () => String }, formattedAddress: { required: false, type: () => String, minLength: 0, maxLength: 500 } };
    }
}
exports.PickupAddressDto = PickupAddressDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 200),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "addressLine1", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 200),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "addressLine2", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 120),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "locality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 120),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "landmark", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.Matches)(/^\d{6}$/, { message: 'Pincode must be 6 digits' }),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], PickupAddressDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], PickupAddressDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 300),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "pickupInstructions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "googlePlaceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "formattedAddress", void 0);
class UpdateOnboardingStepDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { stepKey: { required: true, type: () => Object }, ownerName: { required: false, type: () => String, minLength: 2, maxLength: 100 }, ownerEmail: { required: false, type: () => String }, ownerPhone: { required: false, type: () => String, pattern: "INDIAN_PHONE_OR_E164_REGEX" }, contactMobile: { required: false, type: () => String, pattern: "INDIAN_PHONE_OR_E164_REGEX" }, ownerFullName: { required: false, type: () => String, minLength: 2, maxLength: 100 }, password: { required: false, type: () => String, minLength: 8, maxLength: 72 }, businessName: { required: false, type: () => String, minLength: 2, maxLength: 150 }, legalName: { required: false, type: () => String, minLength: 2, maxLength: 150 }, businessType: { required: false, type: () => Object }, businessTypes: { required: false, type: () => [Object] }, gstNumber: { required: false, type: () => String, minLength: 15, maxLength: 15 }, gstin: { required: false, type: () => String, minLength: 15, maxLength: 15 }, panNumber: { required: false, type: () => String, pattern: "/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/" }, pan: { required: false, type: () => String, pattern: "/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/" }, storeName: { required: false, type: () => String, minLength: 2, maxLength: 100 }, storeDescription: { required: false, type: () => String, minLength: 5, maxLength: 500 }, storeEmail: { required: false, type: () => String }, storePhone: { required: false, type: () => String, pattern: "INDIAN_PHONE_OR_E164_REGEX" }, storeAddress: { required: false, type: () => String, minLength: 5, maxLength: 500 }, addressLine: { required: false, type: () => String, minLength: 5, maxLength: 500 }, pickupAddress: { required: false, type: () => require("./merchant-onboarding.dto").PickupAddressDto }, state: { required: false, type: () => String }, city: { required: false, type: () => String }, cityId: { required: false, type: () => String }, pincode: { required: false, type: () => String, minLength: 6, maxLength: 6 }, locality: { required: false, type: () => String }, area: { required: false, type: () => String }, locationPincodeId: { required: false, type: () => String }, locationAreaId: { required: false, type: () => String }, locationCityId: { required: false, type: () => String }, latitude: { required: false, type: () => Number, minimum: -90, maximum: 90 }, longitude: { required: false, type: () => Number, minimum: -180, maximum: 180 }, deliveryRadiusKm: { required: false, type: () => Number, minimum: 1, maximum: 50 }, deliveryRadius: { required: false, type: () => Number, minimum: 1, maximum: 50 }, operationalCity: { required: false, type: () => String }, deliveryMethod: { required: false, type: () => String }, deliveryProvider: { required: false, type: () => String }, storeLogoUrl: { required: false, type: () => String }, storeBannerUrl: { required: false, type: () => String }, deliveryCoveragePincodes: { required: false, type: () => [String] }, deliveryPincodes: { required: false, type: () => [String] }, selectedCategories: { required: false, type: () => [String] }, categories: { required: false, type: () => [String] }, accountHolderName: { required: false, type: () => String }, accountNumber: { required: false, type: () => String, minLength: 8, maxLength: 20 }, ifsc: { required: false, type: () => String, pattern: "/^[A-Z]{4}0[A-Z0-9]{6}$/" }, bankName: { required: false, type: () => String }, branch: { required: false, type: () => String }, accountType: { required: false, type: () => String }, cancelledChequeUrl: { required: false, type: () => String }, declarationAccepted: { required: false, type: () => Boolean }, submittedForApproval: { required: false, type: () => Boolean } };
    }
}
exports.UpdateOnboardingStepDto = UpdateOnboardingStepDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.MerchantOnboardingStepKey }),
    (0, class_validator_1.IsEnum)(client_1.MerchantOnboardingStepKey),
    __metadata("design:type", typeof (_a = typeof client_1.MerchantOnboardingStepKey !== "undefined" && client_1.MerchantOnboardingStepKey) === "function" ? _a : Object)
], UpdateOnboardingStepDto.prototype, "stepKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "ownerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "ownerEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(INDIAN_PHONE_OR_E164_REGEX, { message: 'Enter a valid 10-digit Indian mobile number' }),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "ownerPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(INDIAN_PHONE_OR_E164_REGEX, { message: 'Enter a valid 10-digit Indian mobile number' }),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "contactMobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "ownerFullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minLength: 8 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 72),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 150),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "businessName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 150),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "legalName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.MerchantBusinessType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.MerchantBusinessType),
    __metadata("design:type", typeof (_b = typeof client_1.MerchantBusinessType !== "undefined" && client_1.MerchantBusinessType) === "function" ? _b : Object)
], UpdateOnboardingStepDto.prototype, "businessType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'Multiple business verticals (super-app)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.MerchantBusinessType, { each: true }),
    __metadata("design:type", Array)
], UpdateOnboardingStepDto.prototype, "businessTypes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(15, 15),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "gstNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(15, 15),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "gstin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'Invalid PAN format' }),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "panNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'Invalid PAN format' }),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "pan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "storeName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(5, 500),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "storeDescription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "storeEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(INDIAN_PHONE_OR_E164_REGEX, { message: 'Enter a valid 10-digit Indian mobile number' }),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "storePhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(5, 500),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "storeAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(5, 500),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "addressLine", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: PickupAddressDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PickupAddressDto),
    __metadata("design:type", PickupAddressDto)
], UpdateOnboardingStepDto.prototype, "pickupAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "cityId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "locality", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "area", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "locationPincodeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "locationAreaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "locationCityId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], UpdateOnboardingStepDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], UpdateOnboardingStepDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], UpdateOnboardingStepDto.prototype, "deliveryRadiusKm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], UpdateOnboardingStepDto.prototype, "deliveryRadius", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "operationalCity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "deliveryMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "deliveryProvider", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://cdn.example.com/logo.jpg' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "storeLogoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://cdn.example.com/banner.jpg' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "storeBannerUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], example: ['201206', '201204'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateOnboardingStepDto.prototype, "deliveryCoveragePincodes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateOnboardingStepDto.prototype, "deliveryPincodes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateOnboardingStepDto.prototype, "selectedCategories", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateOnboardingStepDto.prototype, "categories", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "accountHolderName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 20),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "accountNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC format' }),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "ifsc", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "bankName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "branch", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "accountType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingStepDto.prototype, "cancelledChequeUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateOnboardingStepDto.prototype, "declarationAccepted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateOnboardingStepDto.prototype, "submittedForApproval", void 0);
class UploadMerchantDocumentDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { documentType: { required: true, type: () => Object }, fileName: { required: true, type: () => String, minLength: 1, maxLength: 255 }, mimeType: { required: true, type: () => String, minLength: 1, maxLength: 100 }, fileUrl: { required: true, type: () => String, minLength: 10, maxLength: 5000000 } };
    }
}
exports.UploadMerchantDocumentDto = UploadMerchantDocumentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.MerchantDocumentType }),
    (0, class_validator_1.IsEnum)(client_1.MerchantDocumentType),
    __metadata("design:type", typeof (_c = typeof client_1.MerchantDocumentType !== "undefined" && client_1.MerchantDocumentType) === "function" ? _c : Object)
], UploadMerchantDocumentDto.prototype, "documentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], UploadMerchantDocumentDto.prototype, "fileName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], UploadMerchantDocumentDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Base64 data URL or hosted file URL' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 5_000_000),
    __metadata("design:type", String)
], UploadMerchantDocumentDto.prototype, "fileUrl", void 0);
class SaveBankAccountDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { accountHolderName: { required: true, type: () => String, minLength: 2, maxLength: 100 }, accountNumber: { required: true, type: () => String, minLength: 8, maxLength: 20 }, ifsc: { required: true, type: () => String, pattern: "/^[A-Z]{4}0[A-Z0-9]{6}$/" }, upiId: { required: false, type: () => String, minLength: 3, maxLength: 100 }, bankName: { required: false, type: () => String } };
    }
}
exports.SaveBankAccountDto = SaveBankAccountDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], SaveBankAccountDto.prototype, "accountHolderName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 20),
    __metadata("design:type", String)
], SaveBankAccountDto.prototype, "accountNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC format' }),
    __metadata("design:type", String)
], SaveBankAccountDto.prototype, "ifsc", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 100),
    __metadata("design:type", String)
], SaveBankAccountDto.prototype, "upiId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveBankAccountDto.prototype, "bankName", void 0);
class ValidateGstDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { gstNumber: { required: true, type: () => String, minLength: 15, maxLength: 15 } };
    }
}
exports.ValidateGstDto = ValidateGstDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(15, 15),
    __metadata("design:type", String)
], ValidateGstDto.prototype, "gstNumber", void 0);
class FranchiseLeadDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { contactName: { required: true, type: () => String, minLength: 2, maxLength: 100 }, city: { required: true, type: () => String, minLength: 2, maxLength: 100 }, message: { required: false, type: () => String } };
    }
}
exports.FranchiseLeadDto = FranchiseLeadDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], FranchiseLeadDto.prototype, "contactName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], FranchiseLeadDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FranchiseLeadDto.prototype, "message", void 0);
class ListMerchantApplicationsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: false, type: () => String }, page: { required: false, type: () => Number, minimum: 1 }, limit: { required: false, type: () => Number, minimum: 1, maximum: 100 } };
    }
}
exports.ListMerchantApplicationsDto = ListMerchantApplicationsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListMerchantApplicationsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListMerchantApplicationsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ListMerchantApplicationsDto.prototype, "limit", void 0);
class RejectApplicationDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String, minLength: 5, maxLength: 1000 } };
    }
}
exports.RejectApplicationDto = RejectApplicationDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(5, 1000),
    __metadata("design:type", String)
], RejectApplicationDto.prototype, "reason", void 0);
class RequestApplicationDocumentsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String, minLength: 5, maxLength: 1000 }, documentTypes: { required: true, type: () => [Object] } };
    }
}
exports.RequestApplicationDocumentsDto = RequestApplicationDocumentsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(5, 1000),
    __metadata("design:type", String)
], RequestApplicationDocumentsDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], enum: client_1.MerchantDocumentType }),
    (0, class_validator_1.IsEnum)(client_1.MerchantDocumentType, { each: true }),
    __metadata("design:type", Array)
], RequestApplicationDocumentsDto.prototype, "documentTypes", void 0);
class RequestApplicationChangesDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { message: { required: true, type: () => String, minLength: 5, maxLength: 1000 } };
    }
}
exports.RequestApplicationChangesDto = RequestApplicationChangesDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(5, 1000),
    __metadata("design:type", String)
], RequestApplicationChangesDto.prototype, "message", void 0);
class ScheduleCallDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { notes: { required: true, type: () => String, minLength: 5, maxLength: 500 }, scheduledAt: { required: false, type: () => String } };
    }
}
exports.ScheduleCallDto = ScheduleCallDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(5, 500),
    __metadata("design:type", String)
], ScheduleCallDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleCallDto.prototype, "scheduledAt", void 0);
//# sourceMappingURL=merchant-onboarding.dto.js.map