import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { UpdateRiderLocationDto } from './dto/update-rider-location.dto';

/** Active rider location TTL — 60 seconds. */
const LOCATION_CACHE_TTL = 60;

/** Keep location history for 30 days. */
const LOCATION_HISTORY_DAYS = 30;

export interface CachedLocation {
  riderProfileId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  recordedAt: string;
}

@Injectable()
export class RiderLocationService {
  private readonly logger = new Logger(RiderLocationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private cacheKey(riderProfileId: string): string {
    return `rider:loc:${riderProfileId}`;
  }

  // ── Update location (called on PATCH /rider/location) ─────────────────────

  async updateLocation(riderProfileId: string, dto: UpdateRiderLocationDto): Promise<void> {
    const now = new Date();

    // Upsert latest coords on the profile (for auto-assignment distance queries)
    await this.prisma.riderProfile.update({
      where: { id: riderProfileId },
      data: {
        currentLat: dto.latitude,
        currentLng: dto.longitude,
        lastLocationAt: now,
      },
    });

    // Insert immutable history row
    await this.prisma.riderLocation.create({
      data: {
        riderProfileId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        heading: dto.heading,
        speed: dto.speed,
        accuracy: dto.accuracy,
        recordedAt: now,
      },
    });

    // Refresh Redis cache — fail open
    try {
      const payload: CachedLocation = {
        riderProfileId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        heading: dto.heading,
        speed: dto.speed,
        recordedAt: now.toISOString(),
      };
      await this.redis.set(this.cacheKey(riderProfileId), JSON.stringify(payload), LOCATION_CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Location cache SET error: ${(err as Error).message}`);
    }
  }

  // ── Get latest location from cache (falls back to DB) ─────────────────────

  async getLatestLocation(riderProfileId: string): Promise<CachedLocation | null> {
    try {
      const raw = await this.redis.get(this.cacheKey(riderProfileId));
      if (raw) return JSON.parse(raw) as CachedLocation;
    } catch (err) {
      this.logger.warn(`Location cache GET error: ${(err as Error).message}`);
    }

    // DB fallback
    const profile = await this.prisma.riderProfile.findUnique({
      where: { id: riderProfileId },
      select: { currentLat: true, currentLng: true, lastLocationAt: true },
    });
    if (!profile?.currentLat || !profile?.currentLng) return null;

    return {
      riderProfileId,
      latitude: profile.currentLat,
      longitude: profile.currentLng,
      recordedAt: profile.lastLocationAt?.toISOString() ?? new Date(0).toISOString(),
    };
  }

  // ── Scheduled cleanup: prune location history older than 30 days ──────────

  @Cron('0 2 * * *') // 02:00 every night
  async pruneOldLocations(): Promise<void> {
    const cutoff = new Date(Date.now() - LOCATION_HISTORY_DAYS * 24 * 60 * 60 * 1000);

    const result = await this.prisma.riderLocation.deleteMany({
      where: { recordedAt: { lt: cutoff } },
    });

    if (result.count > 0) {
      this.logger.log(`Pruned ${result.count} rider location records older than ${LOCATION_HISTORY_DAYS} days`);
    }
  }
}
