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
var OrderCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderCacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
const ORDER_CACHE_TTL = 60;
let OrderCacheService = OrderCacheService_1 = class OrderCacheService {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(OrderCacheService_1.name);
    }
    detailKey(orderId) {
        return `order:detail:${orderId}`;
    }
    async getDetail(orderId) {
        try {
            const raw = await this.redis.get(this.detailKey(orderId));
            if (raw) {
                this.logger.debug(`Order cache HIT: ${orderId}`);
                return JSON.parse(raw);
            }
        }
        catch (err) {
            this.logger.warn(`Order cache GET error: ${err.message}`);
        }
        return null;
    }
    async setDetail(orderId, data) {
        try {
            await this.redis.set(this.detailKey(orderId), JSON.stringify(data), ORDER_CACHE_TTL);
        }
        catch (err) {
            this.logger.warn(`Order cache SET error: ${err.message}`);
        }
    }
    async invalidate(orderId) {
        try {
            await this.redis.del(this.detailKey(orderId));
            this.logger.debug(`Order cache INVALIDATED: ${orderId}`);
        }
        catch (err) {
            this.logger.warn(`Order cache DEL error: ${err.message}`);
        }
    }
    async invalidateAll(orderId) {
        await this.invalidate(orderId);
        try {
            const patterns = [
                'order:list:*',
                'buyer:orders:*',
                'merchant:orders:*',
                'merchant:dashboard:*',
                'merchant:analytics:*',
                'admin:orders:*',
                'admin:rider-assignments:*',
                'admin:rider-queue:*',
                'rider:queue:*',
                'rider:orders:*',
                'tracking:order:*',
                'tracking:eta:*',
                'tracking:fleet:live',
            ];
            for (const pattern of patterns) {
                const keys = await this.redis.keys(pattern);
                if (keys.length > 0)
                    await this.redis.del(...keys);
            }
        }
        catch (err) {
            this.logger.warn(`Order list cache purge failed: ${err.message}`);
        }
    }
};
exports.OrderCacheService = OrderCacheService;
exports.OrderCacheService = OrderCacheService = OrderCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], OrderCacheService);
//# sourceMappingURL=order-cache.service.js.map