import { RedisService } from '../../redis/redis.service';
export declare class DeliveryTrackingCacheService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    private trackingKey;
    private etaKey;
    private fleetKey;
    getTracking<T>(orderId: string): Promise<T | null>;
    setTracking<T>(orderId: string, data: T): Promise<void>;
    invalidateTracking(orderId: string): Promise<void>;
    setEta(orderId: string, data: Record<string, unknown>): Promise<void>;
    invalidateFleet(): Promise<void>;
}
