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
var FinanceCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceCacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
const TTL = 120;
let FinanceCacheService = FinanceCacheService_1 = class FinanceCacheService {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(FinanceCacheService_1.name);
    }
    overviewKey() {
        return 'finance:overview';
    }
    settlementsKey(merchantId) {
        return merchantId ? `settlements:merchant:${merchantId}` : 'settlements:platform';
    }
    payoutsKey(kind, id) {
        return id ? `payouts:${kind}:${id}` : `payouts:${kind}:all`;
    }
    async wrap(key, fn, ttl = TTL) {
        try {
            const cached = await this.redis.get(key);
            if (cached)
                return JSON.parse(cached);
        }
        catch (err) {
            this.logger.warn(`Finance cache GET failed: ${err.message}`);
        }
        const result = await fn();
        try {
            await this.redis.set(key, JSON.stringify(result), ttl);
        }
        catch (err) {
            this.logger.warn(`Finance cache SET failed: ${err.message}`);
        }
        return result;
    }
    async invalidateAll() {
        await this.invalidatePattern('finance:*');
        await this.invalidatePattern('settlements:*');
        await this.invalidatePattern('payouts:*');
    }
    async invalidateSettlements() {
        await this.invalidatePattern('settlements:*');
        await this.redis.del(this.overviewKey());
    }
    async invalidatePayouts() {
        await this.invalidatePattern('payouts:*');
        await this.redis.del(this.overviewKey());
    }
    async invalidatePattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0)
                await this.redis.del(...keys);
        }
        catch (err) {
            this.logger.warn(`Finance cache purge failed: ${err.message}`);
        }
    }
};
exports.FinanceCacheService = FinanceCacheService;
exports.FinanceCacheService = FinanceCacheService = FinanceCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], FinanceCacheService);
//# sourceMappingURL=finance-cache.service.js.map