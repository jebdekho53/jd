import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

/** All buyer discovery cache keys expire in 60 seconds per spec. */
const BUYER_CACHE_TTL = 60;

/**
 * Key builders — each key encodes all query dimensions so different
 * query combos never collide. Lat/lng are rounded to 2 decimal places
 * (~1 km grid cell) so nearby requests share a cache entry.
 */
export const BUYER_CACHE_KEYS = {
  storeDiscovery: (lat: number, lng: number, radius: number, page: number, limit: number, sort: string, pincode?: string) =>
    `buyer:stores:${lat.toFixed(2)}:${lng.toFixed(2)}:r${radius}:s${sort}:p${page}:l${limit}:pc${pincode ?? ''}`,

  storeDetail: (slug: string) => `buyer:store:${slug}`,

  storeProducts: (storeId: string, categoryId: string | undefined, page: number, limit: number) =>
    `buyer:store:${storeId}:products:cat${categoryId ?? ''}:p${page}:l${limit}`,

  productSearch: (
    q: string | undefined,
    categoryId: string | undefined,
    subcategoryId: string | undefined,
    storeId: string | undefined,
    page: number,
    limit: number,
  ) =>
    `buyer:search:${q ?? ''}:cat${categoryId ?? ''}:sub${subcategoryId ?? ''}:s${storeId ?? ''}:p${page}:l${limit}`,

  categories: (storeId: string | undefined) => `buyer:categories:s${storeId ?? 'global'}`,
} as const;

@Injectable()
export class BuyerCacheService {
  private readonly logger = new Logger(BuyerCacheService.name);

  constructor(private readonly redis: RedisService) {}

  async wrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        this.logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(cached) as T;
      }
      this.logger.debug(`Cache MISS: ${key}`);
    } catch (err) {
      // Redis failure must never break the request — fall through to DB
      this.logger.warn(`Cache GET error for ${key}: ${(err as Error).message}`);
    }

    const result = await fn();

    try {
      await this.redis.set(key, JSON.stringify(result), BUYER_CACHE_TTL);
      this.logger.debug(`Cache SET: ${key} (TTL ${BUYER_CACHE_TTL}s)`);
    } catch (err) {
      this.logger.warn(`Cache SET error for ${key}: ${(err as Error).message}`);
    }

    return result;
  }

  async invalidate(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.warn(`Cache DEL error for ${key}: ${(err as Error).message}`);
    }
  }

  /**
   * Delete all keys matching a glob pattern.
   * Uses Redis KEYS — acceptable for low-volume admin operations.
   * Never throws; cache failures are non-fatal.
   */
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Cache purged ${keys.length} key(s) matching ${pattern}`);
      }
    } catch (err) {
      this.logger.warn(`Cache pattern DEL error (${pattern}): ${(err as Error).message}`);
    }
  }

  /**
   * Invalidate all buyer-facing caches for a store.
   * Called after approve / reject / suspend / reinstate / merchant update.
   */
  async invalidateStoreCache(slug: string): Promise<void> {
    await Promise.all([
      this.invalidate(BUYER_CACHE_KEYS.storeDetail(slug)),
      this.deleteByPattern('buyer:stores:*'),
      this.deleteByPattern('buyer:search:*'),
      this.deleteByPattern('search:results:*'),
      this.deleteByPattern('search:suggestions:*'),
      this.deleteByPattern('search:trending:*'),
      this.deleteByPattern('search:discover:*'),
    ]);
  }
}
