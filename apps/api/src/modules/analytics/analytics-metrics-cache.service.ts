import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

const DEFAULT_TTL_SEC = 300;

@Injectable()
export class AnalyticsMetricsCacheService {
  private readonly logger = new Logger(AnalyticsMetricsCacheService.name);

  constructor(private readonly redis: RedisService) {}

  key(parts: string[]): string {
    return `analytics:${parts.join(':')}`;
  }

  async get<T>(cacheKey: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(cacheKey);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`Cache get failed: ${(err as Error).message}`);
      return null;
    }
  }

  async set(cacheKey: string, value: unknown, ttlSec = DEFAULT_TTL_SEC): Promise<void> {
    try {
      await this.redis.set(cacheKey, JSON.stringify(value), ttlSec);
    } catch (err) {
      this.logger.warn(`Cache set failed: ${(err as Error).message}`);
    }
  }

  async wrap<T>(cacheKey: string, fn: () => Promise<T>, ttlSec = DEFAULT_TTL_SEC): Promise<T> {
    const cached = await this.get<T>(cacheKey);
    if (cached) return cached;
    const result = await fn();
    await this.set(cacheKey, result, ttlSec);
    return result;
  }
}
