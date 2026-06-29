import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisService } from './redis.service';

const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Acquire an exclusive lock. Returns a release token, or null if another worker holds it.
   */
  async tryAcquire(lockKey: string, ttlSeconds: number): Promise<string | null> {
    const token = randomUUID();
    const client = this.redis.getClient();
    const result = await client.set(`lock:${lockKey}`, token, 'EX', ttlSeconds, 'NX');
    return result === 'OK' ? token : null;
  }

  async release(lockKey: string, token: string): Promise<void> {
    const client = this.redis.getClient();
    await client.eval(RELEASE_SCRIPT, 1, `lock:${lockKey}`, token);
  }

  /** Run fn exclusively; skip silently if lock not acquired. */
  async runExclusive(
    lockKey: string,
    ttlSeconds: number,
    fn: () => Promise<void>,
  ): Promise<boolean> {
    const token = await this.tryAcquire(lockKey, ttlSeconds);
    if (!token) {
      this.logger.debug(`Lock busy, skipping: ${lockKey}`);
      return false;
    }
    try {
      await fn();
      return true;
    } finally {
      await this.release(lockKey, token);
    }
  }
}
