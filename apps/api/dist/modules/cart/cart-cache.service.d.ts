import { RedisService } from '../../redis/redis.service';
export declare class CartCacheService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    private key;
    get<T>(buyerProfileId: string): Promise<T | null>;
    set<T>(buyerProfileId: string, cart: T): Promise<void>;
    invalidate(buyerProfileId: string): Promise<void>;
}
