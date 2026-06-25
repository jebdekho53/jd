import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

const SEARCH_CACHE_TTL = 60;

@Injectable()
export class SearchCacheService {
  private readonly logger = new Logger(SearchCacheService.name);

  constructor(private readonly redis: RedisService) {}

  resultsKey(parts: (string | number | undefined)[]): string {
    return `search:results:${parts.map((p) => String(p ?? '')).join(':')}`;
  }

  suggestionsKey(q: string, lat?: number, lng?: number): string {
    const grid = lat != null && lng != null ? `${lat.toFixed(2)}:${lng.toFixed(2)}` : 'global';
    return `search:suggestions:${grid}:${q.toLowerCase().trim()}`;
  }

  trendingKey(period: string, lat?: number, lng?: number): string {
    const grid = lat != null && lng != null ? `${lat.toFixed(2)}:${lng.toFixed(2)}` : 'global';
    return `search:trending:${period}:${grid}`;
  }

  discoverKey(parts: (string | number | undefined)[]): string {
    return `search:discover:${parts.map((p) => String(p ?? '')).join(':')}`;
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl = SEARCH_CACHE_TTL): Promise<T> {
    try {
      const cached = await this.redis.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch (err) {
      this.logger.warn(`Search cache GET failed: ${(err as Error).message}`);
    }

    const result = await fn();
    try {
      await this.redis.set(key, JSON.stringify(result), ttl);
    } catch (err) {
      this.logger.warn(`Search cache SET failed: ${(err as Error).message}`);
    }
    return result;
  }

  async invalidateAll(): Promise<void> {
    await this.invalidatePattern('search:results:*');
    await this.invalidatePattern('search:suggestions:*');
    await this.invalidatePattern('search:trending:*');
    await this.invalidatePattern('search:discover:*');
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) await this.redis.del(...keys);
    } catch (err) {
      this.logger.warn(`Search cache purge failed (${pattern}): ${(err as Error).message}`);
    }
  }
}
