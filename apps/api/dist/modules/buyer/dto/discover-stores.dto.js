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
exports.DiscoverStoresDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class DiscoverStoresDto {
    constructor() {
        this.radiusKm = 5;
        this.page = 1;
        this.limit = 20;
        this.sort = 'distance';
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { lat: { required: true, type: () => Number }, lng: { required: true, type: () => Number }, pincode: { required: false, type: () => String, minLength: 6, maxLength: 6, pattern: "/^\\d{6}$/" }, radiusKm: { required: false, type: () => Number, default: 5, minimum: 0.1, maximum: 20 }, page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1, maximum: 50 }, sort: { required: false, type: () => Object, default: "distance", enum: ['distance', 'popular', 'fast', 'new', 'rating'] } };
    }
}
exports.DiscoverStoresDto = DiscoverStoresDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 28.6139, description: 'Buyer latitude (WGS-84)' }),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], DiscoverStoresDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 77.209, description: 'Buyer longitude (WGS-84)' }),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], DiscoverStoresDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '201206', description: 'Buyer pincode for delivery coverage' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    (0, class_validator_1.Matches)(/^\d{6}$/),
    __metadata("design:type", String)
], DiscoverStoresDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        example: 5,
        description: 'Search radius in km. Default 5, max 20.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.1),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], DiscoverStoresDto.prototype, "radiusKm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], DiscoverStoresDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], DiscoverStoresDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        enum: ['distance', 'popular', 'fast', 'new', 'rating'],
        default: 'distance',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['distance', 'popular', 'fast', 'new', 'rating']),
    __metadata("design:type", String)
], DiscoverStoresDto.prototype, "sort", void 0);
//# sourceMappingURL=discover-stores.dto.js.map