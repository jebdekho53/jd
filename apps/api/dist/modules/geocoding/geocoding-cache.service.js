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
var GeocodingCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeocodingCacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const redis_service_1 = require("../../redis/redis.service");
const geocoding_util_1 = require("./geocoding.util");
const CACHE_TTL_SEC = 60 * 60 * 24 * 7;
let GeocodingCacheService = GeocodingCacheService_1 = class GeocodingCacheService {
    constructor(redis, config) {
        this.redis = redis;
        this.logger = new common_1.Logger(GeocodingCacheService_1.name);
        this.apiKey =
            config.get('GOOGLE_MAPS_API_KEY', '') ||
                config.get('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', '') ||
                '';
    }
    isConfigured() {
        return Boolean(this.apiKey.trim());
    }
    roundCoord(n) {
        return n.toFixed(5);
    }
    reverseKey(lat, lng) {
        return `geocode:rev:${this.roundCoord(lat)}:${this.roundCoord(lng)}`;
    }
    pincodeKey(pincode) {
        return `geocode:pin:${pincode}`;
    }
    async reverseGeocode(lat, lng) {
        const key = this.reverseKey(lat, lng);
        const cached = await this.redis.get(key);
        if (cached) {
            try {
                return JSON.parse(cached);
            }
            catch {
            }
        }
        if (!this.isConfigured())
            return null;
        try {
            const { data } = await axios_1.default.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: { latlng: `${lat},${lng}`, key: this.apiKey, region: 'in' },
                timeout: 8000,
            });
            const parsed = (0, geocoding_util_1.parseGeocoderResponse)(data, lat, lng);
            if (!parsed)
                return null;
            await this.redis.set(key, JSON.stringify(parsed), CACHE_TTL_SEC);
            if (parsed.pincode) {
                await this.redis.set(this.pincodeKey(parsed.pincode), JSON.stringify(parsed), CACHE_TTL_SEC);
            }
            return parsed;
        }
        catch (err) {
            this.logger.warn({ lat, lng, err }, 'Reverse geocode failed');
            return null;
        }
    }
    async getByPincode(pincode) {
        if (!/^\d{6}$/.test(pincode))
            return null;
        const cached = await this.redis.get(this.pincodeKey(pincode));
        if (cached) {
            try {
                return JSON.parse(cached);
            }
            catch {
            }
        }
        if (!this.isConfigured())
            return null;
        try {
            const { data } = await axios_1.default.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: {
                    address: `${pincode}, India`,
                    components: `postal_code:${pincode}|country:IN`,
                    key: this.apiKey,
                    region: 'in',
                },
                timeout: 8000,
            });
            const parsed = (0, geocoding_util_1.parseGeocoderResponse)(data, 0, 0);
            if (!parsed?.pincode)
                return null;
            await this.redis.set(this.pincodeKey(parsed.pincode), JSON.stringify(parsed), CACHE_TTL_SEC);
            return parsed;
        }
        catch (err) {
            this.logger.warn({ pincode, err }, 'Pincode geocode failed');
            return null;
        }
    }
};
exports.GeocodingCacheService = GeocodingCacheService;
exports.GeocodingCacheService = GeocodingCacheService = GeocodingCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        config_1.ConfigService])
], GeocodingCacheService);
//# sourceMappingURL=geocoding-cache.service.js.map