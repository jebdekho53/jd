import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

const PREFIX = 'compliance:';

@Injectable()
export class ComplianceCacheService {
  constructor(private readonly redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(`${PREFIX}${key}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await this.redis.set(`${PREFIX}${key}`, JSON.stringify(value), ttlSeconds);
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${PREFIX}${pattern}*`);
      if (keys.length > 0) await this.redis.del(...keys);
    } catch {
      // cache purge is best-effort
    }
  }
}
