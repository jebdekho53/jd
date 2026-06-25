import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

const OFFER_CACHE_TTL = 120;

@Injectable()
export class OfferCacheService {
  private readonly logger = new Logger(OfferCacheService.name);

  constructor(private readonly redis: RedisService) {}

  storeOffersKey(storeId: string): string {
    return `offers:store:${storeId}`;
  }

  campaignKey(campaignId: string): string {
    return `campaigns:${campaignId}`;
  }

  couponKey(code: string): string {
    return `coupons:${code.toUpperCase()}`;
  }

  flashSalesKey(): string {
    return 'offers:flash:active';
  }

  personalizedKey(buyerProfileId: string, lat?: number, lng?: number): string {
    const grid = lat != null && lng != null ? `${lat.toFixed(2)}:${lng.toFixed(2)}` : 'global';
    return `offers:personalized:${buyerProfileId}:${grid}`;
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl = OFFER_CACHE_TTL): Promise<T> {
    try {
      const cached = await this.redis.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch (err) {
      this.logger.warn(`Offer cache GET failed: ${(err as Error).message}`);
    }

    const result = await fn();
    try {
      await this.redis.set(key, JSON.stringify(result), ttl);
    } catch (err) {
      this.logger.warn(`Offer cache SET failed: ${(err as Error).message}`);
    }
    return result;
  }

  async invalidateStore(storeId: string): Promise<void> {
    await this.invalidatePattern(`offers:store:${storeId}*`);
    await this.invalidatePattern('offers:flash:active');
    await this.invalidatePattern('offers:personalized:*');
    await this.invalidatePattern('search:results:*');
    await this.invalidatePattern('search:discover:*');
  }

  async invalidateCampaign(campaignId: string): Promise<void> {
    await this.redis.del(this.campaignKey(campaignId));
    await this.invalidatePattern('offers:*');
    await this.invalidatePattern('campaigns:*');
    await this.invalidatePattern('search:results:*');
  }

  async invalidateCoupon(code: string): Promise<void> {
    await this.redis.del(this.couponKey(code));
  }

  async invalidateOnInventoryChange(storeId: string): Promise<void> {
    await this.invalidateStore(storeId);
  }

  private async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) await this.redis.del(...keys);
    } catch (err) {
      this.logger.warn(`Offer cache purge failed (${pattern}): ${(err as Error).message}`);
    }
  }
}
