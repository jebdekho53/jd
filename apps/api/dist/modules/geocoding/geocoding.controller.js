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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeocodingController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const geocoding_cache_service_1 = require("./geocoding-cache.service");
let GeocodingController = class GeocodingController {
    constructor(geocoding) {
        this.geocoding = geocoding;
    }
    async reverse(latRaw, lngRaw) {
        const lat = Number(latRaw);
        const lng = Number(lngRaw);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return { success: true, data: null };
        }
        const data = await this.geocoding.reverseGeocode(lat, lng);
        return { success: true, data };
    }
    async byPincode(pincode) {
        const data = await this.geocoding.getByPincode(pincode ?? '');
        return { success: true, data };
    }
};
exports.GeocodingController = GeocodingController;
__decorate([
    (0, common_1.Get)('reverse'),
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 20 } }),
    (0, swagger_1.ApiOperation)({
        summary: 'Reverse geocode lat/lng with Redis cache',
        description: 'Returns null when Google is unavailable — clients should fall back to pincode/master directory.',
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GeocodingController.prototype, "reverse", null);
__decorate([
    (0, common_1.Get)('pincode'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lookup cached geocode by pincode' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('pincode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GeocodingController.prototype, "byPincode", null);
exports.GeocodingController = GeocodingController = __decorate([
    (0, swagger_1.ApiTags)('geocoding'),
    (0, common_1.Controller)('geo/geocode'),
    __metadata("design:paramtypes", [geocoding_cache_service_1.GeocodingCacheService])
], GeocodingController);
//# sourceMappingURL=geocoding.controller.js.map