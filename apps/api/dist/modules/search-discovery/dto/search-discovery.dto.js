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
exports.TrackSearchEventDto = exports.DiscoverHomeDto = exports.DiscoverStoresSearchDto = exports.SearchTrendingDto = exports.SearchSuggestionsDto = exports.BuyerSearchDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class BuyerSearchDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { q: { required: false, type: () => String }, lat: { required: false, type: () => Number }, lng: { required: false, type: () => Number }, pincode: { required: false, type: () => String, minLength: 6, maxLength: 6, pattern: "/^\\d{6}$/" }, categoryId: { required: false, type: () => String }, subcategoryId: { required: false, type: () => String }, storeId: { required: false, type: () => String }, minPrice: { required: false, type: () => Number, minimum: 0 }, maxPrice: { required: false, type: () => Number }, sort: { required: false, type: () => Object, enum: ['relevance', 'distance', 'price_low_high', 'price_high_low', 'rating', 'fastest_delivery'] }, tab: { required: false, type: () => Object, enum: ['all', 'products', 'stores', 'categories', 'menu_items', 'restaurants'] }, page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1, maximum: 50 }, sessionId: { required: false, type: () => String }, buyerProfileId: { required: false, type: () => String } };
    }
}
exports.BuyerSearchDto = BuyerSearchDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BuyerSearchDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value != null ? parseFloat(value) : undefined)),
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], BuyerSearchDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value != null ? parseFloat(value) : undefined)),
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], BuyerSearchDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    (0, class_validator_1.Matches)(/^\d{6}$/),
    __metadata("design:type", String)
], BuyerSearchDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BuyerSearchDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BuyerSearchDto.prototype, "subcategoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BuyerSearchDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value != null ? parseFloat(value) : undefined)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], BuyerSearchDto.prototype, "minPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value != null ? parseFloat(value) : undefined)),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], BuyerSearchDto.prototype, "maxPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['relevance', 'distance', 'price_low_high', 'price_high_low', 'rating', 'fastest_delivery'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['relevance', 'distance', 'price_low_high', 'price_high_low', 'rating', 'fastest_delivery']),
    __metadata("design:type", String)
], BuyerSearchDto.prototype, "sort", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['all', 'products', 'stores', 'categories', 'menu_items', 'restaurants'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['all', 'products', 'stores', 'categories', 'menu_items', 'restaurants']),
    __metadata("design:type", String)
], BuyerSearchDto.prototype, "tab", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], BuyerSearchDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], BuyerSearchDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BuyerSearchDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BuyerSearchDto.prototype, "buyerProfileId", void 0);
class SearchSuggestionsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { q: { required: true, type: () => String }, lat: { required: false, type: () => Number }, lng: { required: false, type: () => Number } };
    }
}
exports.SearchSuggestionsDto = SearchSuggestionsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchSuggestionsDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value != null ? parseFloat(value) : undefined)),
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], SearchSuggestionsDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value != null ? parseFloat(value) : undefined)),
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], SearchSuggestionsDto.prototype, "lng", void 0);
class SearchTrendingDto {
    constructor() {
        this.period = '7d';
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { period: { required: false, type: () => Object, default: "7d", enum: ['24h', '7d', '30d'] }, lat: { required: false, type: () => Number }, lng: { required: false, type: () => Number } };
    }
}
exports.SearchTrendingDto = SearchTrendingDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['24h', '7d', '30d']),
    __metadata("design:type", String)
], SearchTrendingDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value != null ? parseFloat(value) : undefined)),
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], SearchTrendingDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value != null ? parseFloat(value) : undefined)),
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], SearchTrendingDto.prototype, "lng", void 0);
class DiscoverStoresSearchDto {
    constructor() {
        this.radiusKm = 10;
        this.filter = 'nearest';
        this.page = 1;
        this.limit = 20;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { lat: { required: true, type: () => Number }, lng: { required: true, type: () => Number }, radiusKm: { required: false, type: () => Number, default: 10, minimum: 0.1, maximum: 20 }, pincode: { required: false, type: () => String, minLength: 6, maxLength: 6, pattern: "/^\\d{6}$/" }, filter: { required: false, type: () => Object, default: "nearest", enum: ['nearest', 'best_rated', 'fast_delivery', 'offers', 'new_stores'] }, page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1, maximum: 50 } };
    }
}
exports.DiscoverStoresSearchDto = DiscoverStoresSearchDto;
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], DiscoverStoresSearchDto.prototype, "lat", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], DiscoverStoresSearchDto.prototype, "lng", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.1),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], DiscoverStoresSearchDto.prototype, "radiusKm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '201017' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    (0, class_validator_1.Matches)(/^\d{6}$/),
    __metadata("design:type", String)
], DiscoverStoresSearchDto.prototype, "pincode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['nearest', 'best_rated', 'fast_delivery', 'offers', 'new_stores']),
    __metadata("design:type", String)
], DiscoverStoresSearchDto.prototype, "filter", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], DiscoverStoresSearchDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], DiscoverStoresSearchDto.prototype, "limit", void 0);
class DiscoverHomeDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { lat: { required: true, type: () => Number }, lng: { required: true, type: () => Number }, buyerProfileId: { required: false, type: () => String } };
    }
}
exports.DiscoverHomeDto = DiscoverHomeDto;
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], DiscoverHomeDto.prototype, "lat", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], DiscoverHomeDto.prototype, "lng", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DiscoverHomeDto.prototype, "buyerProfileId", void 0);
class TrackSearchEventDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { eventType: { required: true, type: () => Object, enum: ['QUERY', 'CLICK', 'ADD_TO_CART', 'STORE_CLICK', 'IMPRESSION'] }, query: { required: false, type: () => String }, productId: { required: false, type: () => String }, storeId: { required: false, type: () => String }, categoryId: { required: false, type: () => String }, sessionId: { required: false, type: () => String }, buyerProfileId: { required: false, type: () => String } };
    }
}
exports.TrackSearchEventDto = TrackSearchEventDto;
__decorate([
    (0, class_validator_1.IsIn)(['QUERY', 'CLICK', 'ADD_TO_CART', 'STORE_CLICK', 'IMPRESSION']),
    __metadata("design:type", String)
], TrackSearchEventDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackSearchEventDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackSearchEventDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackSearchEventDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackSearchEventDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackSearchEventDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackSearchEventDto.prototype, "buyerProfileId", void 0);
//# sourceMappingURL=search-discovery.dto.js.map