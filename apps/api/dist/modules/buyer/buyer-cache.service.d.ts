import { RedisService } from '../../redis/redis.service';
export declare const BUYER_CACHE_KEYS: {
    readonly storeDiscovery: (lat: number, lng: number, radius: number, page: number, limit: number, sort: string, pincode?: string) => string;
    readonly storeDetail: (slug: string) => string;
    readonly storeProducts: (storeId: string, categoryId: string | undefined, page: number, limit: number) => string;
    readonly productSearch: (q: string | undefined, categoryId: string | undefined, subcategoryId: string | undefined, storeId: string | undefined, page: number, limit: number) => string;
    readonly categories: (storeId: string | undefined) => string;
    readonly productDetail: (productId: string, storeSlug?: string) => string;
};
export declare class BuyerCacheService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    wrap<T>(key: string, fn: () => Promise<T>): Promise<T>;
    invalidate(key: string): Promise<void>;
    deleteByPattern(pattern: string): Promise<void>;
    invalidateStoreCache(slug: string): Promise<void>;
}
