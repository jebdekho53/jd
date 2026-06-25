import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

const TTL = 120;

@Injectable()
export class FinanceCacheService {
  private readonly logger = new Logger(FinanceCacheService.name);

  constructor(private readonly redis: RedisService) {}

  overviewKey(): string {
    return 'finance:overview';
  }

  settlementsKey(merchantId?: string): string {
    return merchantId ? `settlements:merchant:${merchantId}` : 'settlements:platform';
  }

  payoutsKey(kind: 'merchant' | 'rider', id?: string): string {
    return id ? `payouts:${kind}:${id}` : `payouts:${kind}:all`;
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl = TTL): Promise<T> {
    try {
      const cached = await this.redis.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch (err) {
      this.logger.warn(`Finance cache GET failed: ${(err as Error).message}`);
    }
    const result = await fn();
    try {
      await this.redis.set(key, JSON.stringify(result), ttl);
    } catch (err) {
      this.logger.warn(`Finance cache SET failed: ${(err as Error).message}`);
    }
    return result;
  }

  async invalidateAll(): Promise<void> {
    await this.invalidatePattern('finance:*');
    await this.invalidatePattern('settlements:*');
    await this.invalidatePattern('payouts:*');
  }

  async invalidateSettlements(): Promise<void> {
    await this.invalidatePattern('settlements:*');
    await this.redis.del(this.overviewKey());
  }

  async invalidatePayouts(): Promise<void> {
    await this.invalidatePattern('payouts:*');
    await this.redis.del(this.overviewKey());
  }

  private async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) await this.redis.del(...keys);
    } catch (err) {
      this.logger.warn(`Finance cache purge failed: ${(err as Error).message}`);
    }
  }
}
