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
var InventoryCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryCacheService = void 0;
const common_1 = require("@nestjs/common");
const buyer_cache_service_1 = require("../buyer/buyer-cache.service");
const redis_service_1 = require("../../redis/redis.service");
let InventoryCacheService = InventoryCacheService_1 = class InventoryCacheService {
    constructor(buyerCache, redis) {
        this.buyerCache = buyerCache;
        this.redis = redis;
        this.logger = new common_1.Logger(InventoryCacheService_1.name);
    }
    async invalidateForStores(storeIds) {
        await Promise.all([
            this.buyerCache.deleteByPattern('buyer:categories:*'),
            this.buyerCache.deleteByPattern('buyer:search:*'),
            this.buyerCache.deleteByPattern('buyer:stores:*'),
            this.buyerCache.deleteByPattern('search:results:*'),
            this.buyerCache.deleteByPattern('search:suggestions:*'),
            this.buyerCache.deleteByPattern('search:trending:*'),
            this.buyerCache.deleteByPattern('search:discover:*'),
            this.buyerCache.deleteByPattern('offers:*'),
            this.buyerCache.deleteByPattern('campaigns:*'),
            ...storeIds.flatMap((storeId) => [
                this.buyerCache.deleteByPattern(`buyer:store:${storeId}:*`),
                this.invalidateMerchantInventory(storeId),
            ]),
        ]);
        this.logger.debug(`Inventory cache invalidated for stores: ${storeIds.join(', ')}`);
    }
    async invalidateMerchantInventory(storeId) {
        try {
            const keys = await this.redis.keys(`merchant:*:${storeId}:*inventory*`);
            if (keys.length > 0)
                await this.redis.del(...keys);
        }
        catch (err) {
            this.logger.warn(`Merchant inventory cache purge failed: ${err.message}`);
        }
    }
};
exports.InventoryCacheService = InventoryCacheService;
exports.InventoryCacheService = InventoryCacheService = InventoryCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [buyer_cache_service_1.BuyerCacheService,
        redis_service_1.RedisService])
], InventoryCacheService);
//# sourceMappingURL=inventory-cache.service.js.map