import { RedisService } from '../../redis/redis.service';
export declare class OfferCacheService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    storeOffersKey(storeId: string): string;
    campaignKey(campaignId: string): string;
    couponKey(code: string): string;
    flashSalesKey(): string;
    personalizedKey(buyerProfileId: string, lat?: number, lng?: number): string;
    wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>;
    invalidateStore(storeId: string): Promise<void>;
    invalidateCampaign(campaignId: string): Promise<void>;
    invalidateCoupon(code: string): Promise<void>;
    invalidateOnInventoryChange(storeId: string): Promise<void>;
    private invalidatePattern;
}
