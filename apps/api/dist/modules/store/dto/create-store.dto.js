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
exports.CreateStoreDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const constants_1 = require("../../../common/constants");
const store_hours_dto_1 = require("./store-hours.dto");
class CreateStoreDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 2, maxLength: 100 }, description: { required: false, type: () => String, minLength: 0, maxLength: 500 }, phone: { required: true, type: () => String, pattern: "PHONE_E164_REGEX" }, email: { required: true, type: () => String }, line1: { required: true, type: () => String, minLength: 5, maxLength: 200 }, line2: { required: false, type: () => String, minLength: 0, maxLength: 200 }, pincode: { required: true, type: () => String, minLength: 6, maxLength: 6, pattern: "/^\\d{6}$/" }, latitude: { required: true, type: () => Number, minimum: -90, maximum: 90 }, longitude: { required: true, type: () => Number, minimum: -180, maximum: 180 }, cityId: { required: true, type: () => String }, locationCityId: { required: false, type: () => String }, locationAreaId: { required: false, type: () => String }, locationPincodeId: { required: false, type: () => String }, logoUrl: { required: true, type: () => String }, bannerUrl: { required: true, type: () => String }, minOrderAmount: { required: false, type: () => Number, minimum: 0 }, deliveryFee: { required: false, type: () => Number, minimum: 0 }, avgPrepTimeMins: { required: false, type: () => Number, minimum: 1, maximum: 120 }, zoneIds: { required: false, type: () => [String] }, serviceAreaIds: { required: false, type: () => [String] }, hours: { required: false, type: () => [require("./store-hours.dto").StoreHourDto] }, deliveryCoveragePincodes: { required: false, type: () => [String] } };
    }
}
exports.CreateStoreDto = CreateStoreDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Sharma General Store' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], CreateStoreDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'Fresh groceries delivered in 10 minutes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], CreateStoreDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210' }),
    (0, class_validator_1.Matches)(constants_1.PHONE_E164_REGEX, { message: 'Phone must be in E.164 format' }),
    __metadata("design:type", String)
], CreateStoreDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'store@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateStoreDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '42, Hauz Khas Village' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(5, 200),
    __metadata("design:type", String)
], CreateStoreDto.prototype, "line1", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'Near Metro Gate 3' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 200),
    __metadata("design:type", String)
], CreateStoreDto.prototype, "line2", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '110016' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6, { message: 'Pincode must be exactly 6 digits' }),
    (0, class_validator_1.Matches)(/^\d{6}$/, { message: 'Pincode must be 6 digits' }),
    __metadata("design:type", String)
], CreateStoreDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 28.5494, description: 'Store latitude' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], CreateStoreDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 77.1855, description: 'Store longitude' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], CreateStoreDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'city-cuid', description: 'City ID from /cities' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStoreDto.prototype, "cityId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'loc-city-cuid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStoreDto.prototype, "locationCityId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'loc-area-cuid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStoreDto.prototype, "locationAreaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'loc-pincode-cuid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStoreDto.prototype, "locationPincodeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://cdn.example.com/logo.jpg' }),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateStoreDto.prototype, "logoUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://cdn.example.com/banner.jpg' }),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateStoreDto.prototype, "bannerUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 99, description: 'Minimum order amount in INR' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateStoreDto.prototype, "minOrderAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 29, description: 'Delivery fee in INR (0 = free)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateStoreDto.prototype, "deliveryFee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 15, description: 'Average prep time in minutes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(120),
    __metadata("design:type", Number)
], CreateStoreDto.prototype, "avgPrepTimeMins", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: [String], description: 'Zone IDs to serve' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateStoreDto.prototype, "zoneIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: [String], description: 'Service area IDs (fine-grained)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateStoreDto.prototype, "serviceAreaIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: [store_hours_dto_1.StoreHourDto], description: 'Weekly operating hours' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => store_hours_dto_1.StoreHourDto),
    __metadata("design:type", Array)
], CreateStoreDto.prototype, "hours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: [String], description: 'Additional delivery coverage pincodes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateStoreDto.prototype, "deliveryCoveragePincodes", void 0);
//# sourceMappingURL=create-store.dto.js.map