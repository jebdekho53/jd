import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { RedisService } from '../../redis/redis.service';
export declare class InventoryCacheService {
    private readonly buyerCache;
    private readonly redis;
    private readonly logger;
    constructor(buyerCache: BuyerCacheService, redis: RedisService);
    invalidateForStores(storeIds: string[]): Promise<void>;
    invalidateMerchantInventory(storeId: string): Promise<void>;
}
