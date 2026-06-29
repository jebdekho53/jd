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
var OfferCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferCacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
const OFFER_CACHE_TTL = 120;
let OfferCacheService = OfferCacheService_1 = class OfferCacheService {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(OfferCacheService_1.name);
    }
    storeOffersKey(storeId) {
        return `offers:store:${storeId}`;
    }
    campaignKey(campaignId) {
        return `campaigns:${campaignId}`;
    }
    couponKey(code) {
        return `coupons:${code.toUpperCase()}`;
    }
    flashSalesKey() {
        return 'offers:flash:active';
    }
    personalizedKey(buyerProfileId, lat, lng) {
        const grid = lat != null && lng != null ? `${lat.toFixed(2)}:${lng.toFixed(2)}` : 'global';
        return `offers:personalized:${buyerProfileId}:${grid}`;
    }
    async wrap(key, fn, ttl = OFFER_CACHE_TTL) {
        try {
            const cached = await this.redis.get(key);
            if (cached)
                return JSON.parse(cached);
        }
        catch (err) {
            this.logger.warn(`Offer cache GET failed: ${err.message}`);
        }
        const result = await fn();
        try {
            await this.redis.set(key, JSON.stringify(result), ttl);
        }
        catch (err) {
            this.logger.warn(`Offer cache SET failed: ${err.message}`);
        }
        return result;
    }
    async invalidateStore(storeId) {
        await this.invalidatePattern(`offers:store:${storeId}*`);
        await this.invalidatePattern('offers:flash:active');
        await this.invalidatePattern('offers:personalized:*');
        await this.invalidatePattern('search:results:*');
        await this.invalidatePattern('search:discover:*');
    }
    async invalidateCampaign(campaignId) {
        await this.redis.del(this.campaignKey(campaignId));
        await this.invalidatePattern('offers:*');
        await this.invalidatePattern('campaigns:*');
        await this.invalidatePattern('search:results:*');
    }
    async invalidateCoupon(code) {
        await this.redis.del(this.couponKey(code));
    }
    async invalidateOnInventoryChange(storeId) {
        await this.invalidateStore(storeId);
    }
    async invalidatePattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0)
                await this.redis.del(...keys);
        }
        catch (err) {
            this.logger.warn(`Offer cache purge failed (${pattern}): ${err.message}`);
        }
    }
};
exports.OfferCacheService = OfferCacheService;
exports.OfferCacheService = OfferCacheService = OfferCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], OfferCacheService);
//# sourceMappingURL=offer-cache.service.js.map