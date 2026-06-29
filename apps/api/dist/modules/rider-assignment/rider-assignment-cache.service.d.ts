import { RedisService } from '../../redis/redis.service';
export declare class RiderAssignmentCacheService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    invalidateAssignmentCaches(orderId?: string): Promise<void>;
}
