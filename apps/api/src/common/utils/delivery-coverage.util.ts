import { Prisma } from '@prisma/client';
import {
  checkStoreDeliverability,
  DeliverabilityResult,
  DeliverableStoreShape,
} from './geospatial.util';

export type StoreDeliveryAreaShape = {
  pincode: string;
  isActive: boolean;
  deliveryFee?: Prisma.Decimal | number | null;
  minimumOrder?: Prisma.Decimal | number | null;
  estimatedMinutes?: number | null;
  priority?: number;
};

export type DeliverableStoreWithCoverage = DeliverableStoreShape & {
  deliveryAreas?: StoreDeliveryAreaShape[];
  minOrderAmount?: Prisma.Decimal | number;
  deliveryFee?: Prisma.Decimal | number;
  avgPrepTimeMins?: number;
};

export interface PincodeDeliverabilityOptions {
  buyerPincode?: string | null;
}

export function hasActiveDeliveryAreas(areas?: StoreDeliveryAreaShape[] | null): boolean {
  return Boolean(areas?.some((a) => a.isActive));
}

export function findActiveDeliveryArea(
  areas: StoreDeliveryAreaShape[] | undefined | null,
  pincode: string,
): StoreDeliveryAreaShape | null {
  if (!areas?.length || !pincode) return null;
  const matches = areas.filter((a) => a.isActive && a.pincode === pincode);
  if (matches.length === 0) return null;
  return matches.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0] ?? null;
}

export function storeServesPincode(
  store: DeliverableStoreWithCoverage,
  buyerPincode: string,
): boolean {
  const area = findActiveDeliveryArea(store.deliveryAreas, buyerPincode);
  return area != null;
}

export function resolveDeliveryTerms(
  store: DeliverableStoreWithCoverage,
  buyerPincode?: string | null,
): {
  deliveryFee: number;
  minOrderAmount: number;
  estimatedMinutes: number;
} {
  const area = buyerPincode ? findActiveDeliveryArea(store.deliveryAreas, buyerPincode) : null;
  const toNum = (v: Prisma.Decimal | number | null | undefined, fallback: number) => {
    if (v == null) return fallback;
    return typeof v === 'number' ? v : Number(v);
  };
  return {
    deliveryFee: toNum(area?.deliveryFee, toNum(store.deliveryFee, 0)),
    minOrderAmount: toNum(area?.minimumOrder, toNum(store.minOrderAmount, 0)),
    estimatedMinutes: area?.estimatedMinutes ?? store.avgPrepTimeMins ?? 15,
  };
}

/**
 * Deliverability: pincode coverage when configured, otherwise legacy geo radius.
 */
export function checkStoreDeliverabilityWithCoverage(
  buyerLat: number,
  buyerLng: number,
  store: DeliverableStoreWithCoverage,
  options?: PincodeDeliverabilityOptions,
): DeliverabilityResult {
  const buyerPincode = options?.buyerPincode?.trim();
  if (buyerPincode && hasActiveDeliveryAreas(store.deliveryAreas)) {
    const area = findActiveDeliveryArea(store.deliveryAreas, buyerPincode);
    if (!area) {
      return {
        deliverable: false,
        distanceKm: null,
        effectiveRadiusKm: store.deliveryRadiusKm ?? 5,
        reason: 'Store does not deliver to this pincode',
      };
    }
    const geo = checkStoreDeliverability(buyerLat, buyerLng, store);
    return {
      deliverable: true,
      distanceKm: geo.distanceKm,
      effectiveRadiusKm: geo.effectiveRadiusKm,
    };
  }

  return checkStoreDeliverability(buyerLat, buyerLng, store);
}
