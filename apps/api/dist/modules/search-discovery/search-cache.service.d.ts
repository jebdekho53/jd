import { RedisService } from '../../redis/redis.service';
export declare class SearchCacheService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    resultsKey(parts: (string | number | undefined)[]): string;
    suggestionsKey(q: string, lat?: number, lng?: number): string;
    trendingKey(period: string, lat?: number, lng?: number): string;
    discoverKey(parts: (string | number | undefined)[]): string;
    wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>;
    invalidateAll(): Promise<void>;
    invalidatePattern(pattern: string): Promise<void>;
}
