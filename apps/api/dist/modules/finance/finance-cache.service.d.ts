import { RedisService } from '../../redis/redis.service';
export declare class FinanceCacheService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    overviewKey(): string;
    settlementsKey(merchantId?: string): string;
    payoutsKey(kind: 'merchant' | 'rider', id?: string): string;
    wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>;
    invalidateAll(): Promise<void>;
    invalidateSettlements(): Promise<void>;
    invalidatePayouts(): Promise<void>;
    private invalidatePattern;
}
