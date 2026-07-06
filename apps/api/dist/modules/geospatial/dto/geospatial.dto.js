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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAddressDto = exports.CreateAddressDto = exports.UpdateStoreRadiusDto = exports.CheckDeliverabilityDto = exports.MapStoresQueryDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const geospatial_util_1 = require("../../../common/utils/geospatial.util");
class MapStoresQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { lat: { required: true, type: () => Number, minimum: -90, maximum: 90 }, lng: { required: true, type: () => Number, minimum: -180, maximum: 180 }, radiusKm: { required: false, type: () => Number, minimum: 1, maximum: 25 } };
    }
}
exports.MapStoresQueryDto = MapStoresQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 28.6139 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], MapStoresQueryDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 77.209 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], MapStoresQueryDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 10 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(25),
    __metadata("design:type", Number)
], MapStoresQueryDto.prototype, "radiusKm", void 0);
class CheckDeliverabilityDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { storeId: { required: true, type: () => String }, lat: { required: true, type: () => Number, minimum: -90, maximum: 90 }, lng: { required: true, type: () => Number, minimum: -180, maximum: 180 }, pincode: { required: false, type: () => String, minLength: 6, maxLength: 6, pattern: "/^\\d{6}$/" } };
    }
}
exports.CheckDeliverabilityDto = CheckDeliverabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckDeliverabilityDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], CheckDeliverabilityDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], CheckDeliverabilityDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '201206' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    (0, class_validator_1.Matches)(/^\d{6}$/),
    __metadata("design:type", String)
], CheckDeliverabilityDto.prototype, "pincode", void 0);
class UpdateStoreRadiusDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { deliveryRadiusKm: { required: true, type: () => Number, enum: geospatial_util_1.ALLOWED_DELIVERY_RADII_KM }, locality: { required: false, type: () => String } };
    }
}
exports.UpdateStoreRadiusDto = UpdateStoreRadiusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: geospatial_util_1.ALLOWED_DELIVERY_RADII_KM }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsIn)(geospatial_util_1.ALLOWED_DELIVERY_RADII_KM),
    __metadata("design:type", Number)
], UpdateStoreRadiusDto.prototype, "deliveryRadiusKm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStoreRadiusDto.prototype, "locality", void 0);
class CreateAddressDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { label: { required: false, type: () => Object }, line1: { required: true, type: () => String }, line2: { required: false, type: () => String }, landmark: { required: false, type: () => String }, city: { required: true, type: () => String }, state: { required: true, type: () => String }, pincode: { required: true, type: () => String }, latitude: { required: true, type: () => Number }, longitude: { required: true, type: () => Number }, locationCityId: { required: false, type: () => String }, locationAreaId: { required: false, type: () => String }, locationPincodeId: { required: false, type: () => String }, isDefault: { required: false, type: () => Boolean } };
    }
}
exports.CreateAddressDto = CreateAddressDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.AddressLabel }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.AddressLabel),
    __metadata("design:type", typeof (_a = typeof client_1.AddressLabel !== "undefined" && client_1.AddressLabel) === "function" ? _a : Object)
], CreateAddressDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAddressDto.prototype, "line1", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAddressDto.prototype, "line2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAddressDto.prototype, "landmark", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAddressDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAddressDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAddressDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAddressDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAddressDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAddressDto.prototype, "locationCityId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAddressDto.prototype, "locationAreaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAddressDto.prototype, "locationPincodeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAddressDto.prototype, "isDefault", void 0);
class UpdateAddressDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { label: { required: false, type: () => Object }, line1: { required: false, type: () => String }, line2: { required: false, type: () => String }, landmark: { required: false, type: () => String }, city: { required: false, type: () => String }, state: { required: false, type: () => String }, pincode: { required: false, type: () => String }, latitude: { required: false, type: () => Number }, longitude: { required: false, type: () => Number }, locationCityId: { required: false, type: () => String }, locationAreaId: { required: false, type: () => String }, locationPincodeId: { required: false, type: () => String }, isDefault: { required: false, type: () => Boolean } };
    }
}
exports.UpdateAddressDto = UpdateAddressDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.AddressLabel }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.AddressLabel),
    __metadata("design:type", typeof (_b = typeof client_1.AddressLabel !== "undefined" && client_1.AddressLabel) === "function" ? _b : Object)
], UpdateAddressDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAddressDto.prototype, "line1", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAddressDto.prototype, "line2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAddressDto.prototype, "landmark", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAddressDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAddressDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAddressDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateAddressDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateAddressDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAddressDto.prototype, "locationCityId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAddressDto.prototype, "locationAreaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAddressDto.prototype, "locationPincodeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAddressDto.prototype, "isDefault", void 0);
//# sourceMappingURL=geospatial.dto.js.map