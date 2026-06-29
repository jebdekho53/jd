import { RedisService } from './redis.service';
export declare class DistributedLockService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    tryAcquire(lockKey: string, ttlSeconds: number): Promise<string | null>;
    release(lockKey: string, token: string): Promise<void>;
    runExclusive(lockKey: string, ttlSeconds: number, fn: () => Promise<void>): Promise<boolean>;
}
