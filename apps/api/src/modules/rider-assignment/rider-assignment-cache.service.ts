import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class RiderAssignmentCacheService {
  private readonly logger = new Logger(RiderAssignmentCacheService.name);

  constructor(private readonly redis: RedisService) {}

  async invalidateAssignmentCaches(orderId?: string): Promise<void> {
    const patterns = [
      'admin:rider-assignments:*',
      'admin:rider-queue:*',
      'rider:queue:*',
      'order:list:*',
      'buyer:orders:*',
      'merchant:orders:*',
      'merchant:dashboard:*',
      'admin:orders:*',
      'rider:orders:*',
    ];

    if (orderId) {
      try {
        await this.redis.del(`order:detail:${orderId}`);
      } catch (err) {
        this.logger.warn(`Detail cache DEL failed: ${(err as Error).message}`);
      }
    }

    for (const pattern of patterns) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) await this.redis.del(...keys);
      } catch (err) {
        this.logger.warn(`Cache purge failed for ${pattern}: ${(err as Error).message}`);
      }
    }
  }
}
