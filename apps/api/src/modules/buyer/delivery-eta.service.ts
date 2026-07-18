import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import {
  DEFAULT_RIDER_SPEED_KMH,
  MAX_DELIVERY_DISTANCE_KM,
  isValidCoordinate,
  minutesAtSpeedKm,
  haversineKm,
  roadDistanceKm,
} from '../../common/utils/delivery-eta.util';
import { trafficSpeedFactor } from '../../common/utils/geospatial.util';

export interface DeliveryEtaQuery {
  storeId: string;
  storeLat: number;
  storeLng: number;
  buyerLat: number;
  buyerLng: number;
  avgPrepTimeMins: number;
}

export interface DeliveryEtaResult {
  /** Total door-to-door estimate: prep + travel. Null when undeliverable. */
  etaMinutes: number | null;
  distanceKm: number | null;
  /** 'google' = live road+traffic routing; 'estimate' = road-adjusted haversine. */
  source: 'google' | 'estimate' | 'unavailable';
}

/**
 * Checkout-time delivery ETA.
 *
 * Precise by design: at the point of ordering, distance is resolved with the
 * Google Distance Matrix API (real road distance + live traffic duration) and
 * cached per store + location cell so we make at most one call per store for a
 * given neighbourhood per TTL — never one call per product.
 *
 * If Google is unconfigured, unbilled, or errors, it degrades to the same
 * road-adjusted haversine estimate used while browsing, so checkout never breaks
 * on a routing outage — it just shows a slightly less precise number.
 */
@Injectable()
export class DeliveryEtaService {
  private readonly logger = new Logger(DeliveryEtaService.name);
  private readonly apiKey: string | undefined;
  /** ~110m cells: nearby buyers share a store's cached distance, bounding calls. */
  private readonly CELL_DECIMALS = 3;
  private readonly CACHE_TTL_SECONDS = 600;

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
  }

  async estimate(q: DeliveryEtaQuery): Promise<DeliveryEtaResult> {
    if (
      !isValidCoordinate(q.storeLat, q.storeLng) ||
      !isValidCoordinate(q.buyerLat, q.buyerLng)
    ) {
      return { etaMinutes: null, distanceKm: null, source: 'unavailable' };
    }

    const straightKm = haversineKm(q.storeLat, q.storeLng, q.buyerLat, q.buyerLng);
    if (straightKm > MAX_DELIVERY_DISTANCE_KM) {
      return { etaMinutes: null, distanceKm: null, source: 'unavailable' };
    }

    const google = await this.tryGoogle(q);
    if (google) return google;

    // Fallback — road-adjusted haversine + time-of-day traffic.
    const roadKm = roadDistanceKm(straightKm);
    const travelMins = minutesAtSpeedKm(roadKm, DEFAULT_RIDER_SPEED_KMH, trafficSpeedFactor());
    return {
      etaMinutes: Math.max(10, Math.round(q.avgPrepTimeMins) + travelMins),
      distanceKm: roadKm,
      source: 'estimate',
    };
  }

  private cacheKey(q: DeliveryEtaQuery): string {
    const lat = q.buyerLat.toFixed(this.CELL_DECIMALS);
    const lng = q.buyerLng.toFixed(this.CELL_DECIMALS);
    return `checkout:eta:${q.storeId}:${lat}:${lng}`;
  }

  private async tryGoogle(q: DeliveryEtaQuery): Promise<DeliveryEtaResult | null> {
    if (!this.apiKey) return null;

    const key = this.cacheKey(q);
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        const parsed = JSON.parse(cached) as { distanceKm: number; drivingMins: number };
        return this.compose(parsed.distanceKm, parsed.drivingMins, q.avgPrepTimeMins);
      }
    } catch {
      // cache miss / parse error — fall through to a fresh call
    }

    try {
      const url =
        `https://maps.googleapis.com/maps/api/distancematrix/json` +
        `?origins=${q.storeLat},${q.storeLng}` +
        `&destinations=${q.buyerLat},${q.buyerLng}` +
        `&mode=driving&departure_time=now&key=${this.apiKey}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) return null;
      const body = (await res.json()) as GoogleDistanceMatrixResponse;

      const el = body.rows?.[0]?.elements?.[0];
      if (body.status !== 'OK' || !el || el.status !== 'OK') {
        // REQUEST_DENIED (API not enabled / no billing) lands here → fallback.
        this.logger.warn(`Distance Matrix non-OK: top=${body.status} el=${el?.status}`);
        return null;
      }

      const distanceKm = Math.round((el.distance.value / 1000) * 100) / 100;
      const drivingSecs = (el.duration_in_traffic ?? el.duration).value;
      const drivingMins = Math.max(1, Math.round(drivingSecs / 60));

      await this.redis
        .set(key, JSON.stringify({ distanceKm, drivingMins }), this.CACHE_TTL_SECONDS)
        .catch(() => {});

      return this.compose(distanceKm, drivingMins, q.avgPrepTimeMins);
    } catch (err) {
      this.logger.warn(`Distance Matrix call failed: ${(err as Error).message}`);
      return null;
    }
  }

  private compose(distanceKm: number, drivingMins: number, avgPrepTimeMins: number): DeliveryEtaResult {
    return {
      etaMinutes: Math.max(10, Math.round(avgPrepTimeMins) + drivingMins),
      distanceKm,
      source: 'google',
    };
  }
}

interface GoogleDistanceMatrixResponse {
  status: string;
  rows?: Array<{
    elements?: Array<{
      status: string;
      distance: { value: number };
      duration: { value: number };
      duration_in_traffic?: { value: number };
    }>;
  }>;
}
