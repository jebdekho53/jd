import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

const TRACKING_CACHE_TTL = 30;
const ETA_CACHE_TTL = 30;

@Injectable()
export class DeliveryTrackingCacheService {
  private readonly logger = new Logger(DeliveryTrackingCacheService.name);

  constructor(private readonly redis: RedisService) {}

  private trackingKey(orderId: string): string {
    return `tracking:order:${orderId}`;
  }

  private etaKey(orderId: string): string {
    return `tracking:eta:${orderId}`;
  }

  private fleetKey(): string {
    return 'tracking:fleet:live';
  }

  async getTracking<T>(orderId: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(this.trackingKey(orderId));
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      this.logger.warn(`Tracking cache GET: ${(err as Error).message}`);
      return null;
    }
  }

  async setTracking<T>(orderId: string, data: T): Promise<void> {
    try {
      await this.redis.set(this.trackingKey(orderId), JSON.stringify(data), TRACKING_CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Tracking cache SET: ${(err as Error).message}`);
    }
  }

  async invalidateTracking(orderId: string): Promise<void> {
    try {
      await this.redis.del(this.trackingKey(orderId), this.etaKey(orderId));
    } catch (err) {
      this.logger.warn(`Tracking cache DEL: ${(err as Error).message}`);
    }
  }

  async setEta(orderId: string, data: Record<string, unknown>): Promise<void> {
    try {
      await this.redis.set(this.etaKey(orderId), JSON.stringify(data), ETA_CACHE_TTL);
    } catch (err) {
      this.logger.warn(`ETA cache SET: ${(err as Error).message}`);
    }
  }

  async invalidateFleet(): Promise<void> {
    try {
      await this.redis.del(this.fleetKey());
    } catch (err) {
      this.logger.warn(`Fleet cache DEL: ${(err as Error).message}`);
    }
  }
}
