import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

/** 60 seconds — order detail cache. Invalidated on every status change. */
const ORDER_CACHE_TTL = 60;

@Injectable()
export class OrderCacheService {
  private readonly logger = new Logger(OrderCacheService.name);

  constructor(private readonly redis: RedisService) {}

  private detailKey(orderId: string): string {
    return `order:detail:${orderId}`;
  }

  async getDetail<T>(orderId: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(this.detailKey(orderId));
      if (raw) {
        this.logger.debug(`Order cache HIT: ${orderId}`);
        return JSON.parse(raw) as T;
      }
    } catch (err) {
      this.logger.warn(`Order cache GET error: ${(err as Error).message}`);
    }
    return null;
  }

  async setDetail<T>(orderId: string, data: T): Promise<void> {
    try {
      await this.redis.set(this.detailKey(orderId), JSON.stringify(data), ORDER_CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Order cache SET error: ${(err as Error).message}`);
    }
  }

  async invalidate(orderId: string): Promise<void> {
    try {
      await this.redis.del(this.detailKey(orderId));
      this.logger.debug(`Order cache INVALIDATED: ${orderId}`);
    } catch (err) {
      this.logger.warn(`Order cache DEL error: ${(err as Error).message}`);
    }
  }

  /** Invalidate detail + list caches for all roles after any order mutation. */
  async invalidateAll(orderId: string): Promise<void> {
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
        if (keys.length > 0) await this.redis.del(...keys);
      }
    } catch (err) {
      this.logger.warn(`Order list cache purge failed: ${(err as Error).message}`);
    }
  }
}
