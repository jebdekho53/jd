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
var BuyerCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyerCacheService = exports.BUYER_CACHE_KEYS = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
const BUYER_CACHE_TTL = 60;
exports.BUYER_CACHE_KEYS = {
    storeDiscovery: (lat, lng, radius, page, limit, sort, pincode) => `buyer:stores:${lat.toFixed(2)}:${lng.toFixed(2)}:r${radius}:s${sort}:p${page}:l${limit}:pc${pincode ?? ''}`,
    storeDetail: (slug) => `buyer:store:${slug}`,
    storeProducts: (storeId, categoryId, page, limit) => `buyer:store:${storeId}:products:cat${categoryId ?? ''}:p${page}:l${limit}`,
    productSearch: (q, categoryId, subcategoryId, storeId, page, limit) => `buyer:search:${q ?? ''}:cat${categoryId ?? ''}:sub${subcategoryId ?? ''}:s${storeId ?? ''}:p${page}:l${limit}`,
    categories: (storeId) => `buyer:categories:s${storeId ?? 'global'}`,
    productDetail: (productId, storeSlug) => `buyer:product:${productId}:s${storeSlug ?? ''}`,
};
let BuyerCacheService = BuyerCacheService_1 = class BuyerCacheService {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(BuyerCacheService_1.name);
    }
    async wrap(key, fn) {
        try {
            const cached = await this.redis.get(key);
            if (cached) {
                this.logger.debug(`Cache HIT: ${key}`);
                return JSON.parse(cached);
            }
            this.logger.debug(`Cache MISS: ${key}`);
        }
        catch (err) {
            this.logger.warn(`Cache GET error for ${key}: ${err.message}`);
        }
        const result = await fn();
        try {
            await this.redis.set(key, JSON.stringify(result), BUYER_CACHE_TTL);
            this.logger.debug(`Cache SET: ${key} (TTL ${BUYER_CACHE_TTL}s)`);
        }
        catch (err) {
            this.logger.warn(`Cache SET error for ${key}: ${err.message}`);
        }
        return result;
    }
    async invalidate(key) {
        try {
            await this.redis.del(key);
        }
        catch (err) {
            this.logger.warn(`Cache DEL error for ${key}: ${err.message}`);
        }
    }
    async deleteByPattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                this.logger.debug(`Cache purged ${keys.length} key(s) matching ${pattern}`);
            }
        }
        catch (err) {
            this.logger.warn(`Cache pattern DEL error (${pattern}): ${err.message}`);
        }
    }
    async invalidateStoreCache(slug) {
        await Promise.all([
            this.invalidate(exports.BUYER_CACHE_KEYS.storeDetail(slug)),
            this.deleteByPattern('buyer:stores:*'),
            this.deleteByPattern('buyer:search:*'),
            this.deleteByPattern('search:results:*'),
            this.deleteByPattern('search:suggestions:*'),
            this.deleteByPattern('search:trending:*'),
            this.deleteByPattern('search:discover:*'),
        ]);
    }
};
exports.BuyerCacheService = BuyerCacheService;
exports.BuyerCacheService = BuyerCacheService = BuyerCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], BuyerCacheService);
//# sourceMappingURL=buyer-cache.service.js.map