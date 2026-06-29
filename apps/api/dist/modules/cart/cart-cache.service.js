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
var CartCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartCacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
const CART_CACHE_TTL = 15 * 60;
let CartCacheService = CartCacheService_1 = class CartCacheService {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(CartCacheService_1.name);
    }
    key(buyerProfileId) {
        return `buyer:cart:${buyerProfileId}`;
    }
    async get(buyerProfileId) {
        try {
            const raw = await this.redis.get(this.key(buyerProfileId));
            if (raw) {
                this.logger.debug(`Cart cache HIT: ${buyerProfileId}`);
                return JSON.parse(raw);
            }
        }
        catch (err) {
            this.logger.warn(`Cart cache GET error: ${err.message}`);
        }
        return null;
    }
    async set(buyerProfileId, cart) {
        try {
            await this.redis.set(this.key(buyerProfileId), JSON.stringify(cart), CART_CACHE_TTL);
            this.logger.debug(`Cart cache SET: ${buyerProfileId}`);
        }
        catch (err) {
            this.logger.warn(`Cart cache SET error: ${err.message}`);
        }
    }
    async invalidate(buyerProfileId) {
        try {
            await this.redis.del(this.key(buyerProfileId));
            this.logger.debug(`Cart cache INVALIDATED: ${buyerProfileId}`);
        }
        catch (err) {
            this.logger.warn(`Cart cache DEL error: ${err.message}`);
        }
    }
};
exports.CartCacheService = CartCacheService;
exports.CartCacheService = CartCacheService = CartCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], CartCacheService);
//# sourceMappingURL=cart-cache.service.js.map