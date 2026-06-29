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
var AnalyticsMetricsCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsMetricsCacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
const DEFAULT_TTL_SEC = 300;
let AnalyticsMetricsCacheService = AnalyticsMetricsCacheService_1 = class AnalyticsMetricsCacheService {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(AnalyticsMetricsCacheService_1.name);
    }
    key(parts) {
        return `analytics:${parts.join(':')}`;
    }
    async get(cacheKey) {
        try {
            const raw = await this.redis.get(cacheKey);
            if (!raw)
                return null;
            return JSON.parse(raw);
        }
        catch (err) {
            this.logger.warn(`Cache get failed: ${err.message}`);
            return null;
        }
    }
    async set(cacheKey, value, ttlSec = DEFAULT_TTL_SEC) {
        try {
            await this.redis.set(cacheKey, JSON.stringify(value), ttlSec);
        }
        catch (err) {
            this.logger.warn(`Cache set failed: ${err.message}`);
        }
    }
    async wrap(cacheKey, fn, ttlSec = DEFAULT_TTL_SEC) {
        const cached = await this.get(cacheKey);
        if (cached)
            return cached;
        const result = await fn();
        await this.set(cacheKey, result, ttlSec);
        return result;
    }
};
exports.AnalyticsMetricsCacheService = AnalyticsMetricsCacheService;
exports.AnalyticsMetricsCacheService = AnalyticsMetricsCacheService = AnalyticsMetricsCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], AnalyticsMetricsCacheService);
//# sourceMappingURL=analytics-metrics-cache.service.js.map