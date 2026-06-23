import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

/** 15 minutes — buyer cart stays warm while shopping. */
const CART_CACHE_TTL = 15 * 60;

@Injectable()
export class CartCacheService {
  private readonly logger = new Logger(CartCacheService.name);

  constructor(private readonly redis: RedisService) {}

  private key(buyerProfileId: string): string {
    return `buyer:cart:${buyerProfileId}`;
  }

  async get<T>(buyerProfileId: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(this.key(buyerProfileId));
      if (raw) {
        this.logger.debug(`Cart cache HIT: ${buyerProfileId}`);
        return JSON.parse(raw) as T;
      }
    } catch (err) {
      // Redis failure must never break checkout flow — fail open
      this.logger.warn(`Cart cache GET error: ${(err as Error).message}`);
    }
    return null;
  }

  async set<T>(buyerProfileId: string, cart: T): Promise<void> {
    try {
      await this.redis.set(this.key(buyerProfileId), JSON.stringify(cart), CART_CACHE_TTL);
      this.logger.debug(`Cart cache SET: ${buyerProfileId}`);
    } catch (err) {
      this.logger.warn(`Cart cache SET error: ${(err as Error).message}`);
    }
  }

  async invalidate(buyerProfileId: string): Promise<void> {
    try {
      await this.redis.del(this.key(buyerProfileId));
      this.logger.debug(`Cart cache INVALIDATED: ${buyerProfileId}`);
    } catch (err) {
      this.logger.warn(`Cart cache DEL error: ${(err as Error).message}`);
    }
  }
}
