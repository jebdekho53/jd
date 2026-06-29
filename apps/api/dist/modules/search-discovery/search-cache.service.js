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
var SearchCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchCacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
const SEARCH_CACHE_TTL = 60;
let SearchCacheService = SearchCacheService_1 = class SearchCacheService {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(SearchCacheService_1.name);
    }
    resultsKey(parts) {
        return `search:results:${parts.map((p) => String(p ?? '')).join(':')}`;
    }
    suggestionsKey(q, lat, lng) {
        const grid = lat != null && lng != null ? `${lat.toFixed(2)}:${lng.toFixed(2)}` : 'global';
        return `search:suggestions:${grid}:${q.toLowerCase().trim()}`;
    }
    trendingKey(period, lat, lng) {
        const grid = lat != null && lng != null ? `${lat.toFixed(2)}:${lng.toFixed(2)}` : 'global';
        return `search:trending:${period}:${grid}`;
    }
    discoverKey(parts) {
        return `search:discover:${parts.map((p) => String(p ?? '')).join(':')}`;
    }
    async wrap(key, fn, ttl = SEARCH_CACHE_TTL) {
        try {
            const cached = await this.redis.get(key);
            if (cached)
                return JSON.parse(cached);
        }
        catch (err) {
            this.logger.warn(`Search cache GET failed: ${err.message}`);
        }
        const result = await fn();
        try {
            await this.redis.set(key, JSON.stringify(result), ttl);
        }
        catch (err) {
            this.logger.warn(`Search cache SET failed: ${err.message}`);
        }
        return result;
    }
    async invalidateAll() {
        await this.invalidatePattern('search:results:*');
        await this.invalidatePattern('search:suggestions:*');
        await this.invalidatePattern('search:trending:*');
        await this.invalidatePattern('search:discover:*');
    }
    async invalidatePattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0)
                await this.redis.del(...keys);
        }
        catch (err) {
            this.logger.warn(`Search cache purge failed (${pattern}): ${err.message}`);
        }
    }
};
exports.SearchCacheService = SearchCacheService;
exports.SearchCacheService = SearchCacheService = SearchCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], SearchCacheService);
//# sourceMappingURL=search-cache.service.js.map