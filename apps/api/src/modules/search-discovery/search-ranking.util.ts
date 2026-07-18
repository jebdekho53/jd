/**
 * Hyperlocal search ranking (P4.2)
 *
 * Score =
 *   40% relevance
 *   20% distance (closer wins)
 *   15% inventory availability
 *   10% merchant rating
 *   10% delivery speed (lower prep time wins)
 *    5% active offer
 */

import {
  DEFAULT_RIDER_SPEED_KMH,
  minutesAtSpeedKm,
  roadDistanceKm,
} from '../../common/utils/delivery-eta.util';
import { trafficSpeedFactor } from '../../common/utils/geospatial.util';

export interface RankingSignals {
  relevance: number;
  distanceKm: number | null;
  maxDistanceKm: number;
  availableQty: number;
  maxQtyInPool: number;
  ratingAvg: number;
  avgPrepTimeMins: number;
  hasActiveOffer: boolean;
  isFlashSale?: boolean;
  campaignConversion?: number;
}

export const RANKING_WEIGHTS = {
  relevance: 0.4,
  distance: 0.2,
  inventory: 0.15,
  rating: 0.1,
  deliverySpeed: 0.1,
  offer: 0.05,
} as const;

export function normalizeRelevance(raw: number): number {
  return Math.min(1, raw / 200);
}

export function normalizeDistance(distanceKm: number | null, maxKm: number): number {
  if (distanceKm == null || maxKm <= 0) return 0.35;
  return 1 - Math.min(1, distanceKm / maxKm);
}

export function normalizeInventory(qty: number, maxInPool: number): number {
  if (qty <= 0) return 0;
  if (maxInPool <= 0) return 1;
  return Math.min(1, qty / maxInPool);
}

export function normalizeRating(ratingAvg: number): number {
  return Math.min(1, Math.max(0, ratingAvg) / 5);
}

export function normalizeDeliverySpeed(avgPrepTimeMins: number): number {
  const capped = Math.max(5, Math.min(90, avgPrepTimeMins || 20));
  return 1 - (capped - 5) / 85;
}

export function computeHyperlocalScore(signals: RankingSignals): number {
  const relevance = normalizeRelevance(signals.relevance);
  const distance = normalizeDistance(signals.distanceKm, signals.maxDistanceKm);
  const inventory = normalizeInventory(signals.availableQty, signals.maxQtyInPool);
  const rating = normalizeRating(signals.ratingAvg);
  const delivery = normalizeDeliverySpeed(signals.avgPrepTimeMins);
  let offer = signals.hasActiveOffer ? 1 : 0;
  if (signals.isFlashSale) offer = Math.min(1, offer + 0.5);
  if (signals.campaignConversion != null && signals.campaignConversion > 5) {
    offer = Math.min(1, offer + 0.25);
  }

  return (
    RANKING_WEIGHTS.relevance * relevance +
    RANKING_WEIGHTS.distance * distance +
    RANKING_WEIGHTS.inventory * inventory +
    RANKING_WEIGHTS.rating * rating +
    RANKING_WEIGHTS.deliverySpeed * delivery +
    RANKING_WEIGHTS.offer * offer
  );
}

/** Field-weighted text relevance (name > brand > tags > description). */
export function textRelevanceScore(
  fields: { name: string; brand: string | null; tags: string[]; description: string | null },
  rawQuery: string,
): number {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return 0;

  let score = 0;
  const nameL = fields.name.toLowerCase();
  if (nameL === q) score += 200;
  else if (nameL.includes(q)) score += 100;
  else if (q.split(/\s+/).every((w) => nameL.includes(w))) score += 80;

  const brandL = (fields.brand ?? '').toLowerCase();
  if (brandL === q) score += 100;
  else if (brandL.includes(q)) score += 50;

  for (const tag of fields.tags) {
    const tagL = tag.toLowerCase();
    if (tagL === q) score += 50;
    else if (tagL.includes(q)) score += 25;
  }

  const descL = (fields.description ?? '').toLowerCase();
  if (descL.includes(q)) score += 10;

  return score;
}

/**
 * Pre-order (browse/PDP) ETA = prep time + travel time.
 *
 * Travel uses road-adjusted distance and a time-of-day traffic factor rather
 * than a flat straight-line/20 km/h guess, so the number a buyer sees before
 * ordering is realistic (and errs on the honest side). This is the cheap
 * estimate used while browsing; checkout resolves a precise ETA via the routing
 * provider.
 */
export function estimateDeliveryEtaMins(distanceKm: number, avgPrepTimeMins: number): number {
  const travelMins = minutesAtSpeedKm(
    roadDistanceKm(distanceKm),
    DEFAULT_RIDER_SPEED_KMH,
    trafficSpeedFactor(),
  );
  return Math.max(10, avgPrepTimeMins + travelMins);
}
