import { RedisService } from '../../redis/redis.service';
export declare class ComplianceCacheService {
    private readonly redis;
    constructor(redis: RedisService);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    invalidate(pattern: string): Promise<void>;
}
