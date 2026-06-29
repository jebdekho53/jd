import { RedisService } from '../../redis/redis.service';
export declare class OrderCacheService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    private detailKey;
    getDetail<T>(orderId: string): Promise<T | null>;
    setDetail<T>(orderId: string, data: T): Promise<void>;
    invalidate(orderId: string): Promise<void>;
    invalidateAll(orderId: string): Promise<void>;
}
