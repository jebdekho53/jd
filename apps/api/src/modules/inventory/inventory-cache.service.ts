import { Injectable, Logger } from '@nestjs/common';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class InventoryCacheService {
  private readonly logger = new Logger(InventoryCacheService.name);

  constructor(
    private readonly buyerCache: BuyerCacheService,
    private readonly redis: RedisService,
  ) {}

  async invalidateForStores(storeIds: string[]): Promise<void> {
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

  async invalidateMerchantInventory(storeId: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`merchant:*:${storeId}:*inventory*`);
      if (keys.length > 0) await this.redis.del(...keys);
    } catch (err) {
      this.logger.warn(`Merchant inventory cache purge failed: ${(err as Error).message}`);
    }
  }
}
