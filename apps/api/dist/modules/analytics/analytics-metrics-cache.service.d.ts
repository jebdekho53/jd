import { RedisService } from '../../redis/redis.service';
export declare class AnalyticsMetricsCacheService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    key(parts: string[]): string;
    get<T>(cacheKey: string): Promise<T | null>;
    set(cacheKey: string, value: unknown, ttlSec?: number): Promise<void>;
    wrap<T>(cacheKey: string, fn: () => Promise<T>, ttlSec?: number): Promise<T>;
}
