import { Prisma, StoreStatus } from '@prisma/client';
import {
  checkStoreDeliverabilityWithCoverage,
  DeliverableStoreWithCoverage,
  findActiveDeliveryArea,
  resolveDeliveryTerms,
} from '../../common/utils/delivery-coverage.util';
import type { DeliverabilityResult } from '../../common/utils/geospatial.util';

/** Approved, active stores visible to buyers. */
export const STORE_VISIBLE_WHERE: Prisma.StoreWhereInput = {
  status: StoreStatus.APPROVED,
  isActive: true,
  deletedAt: null,
};

/**
 * A product is visible to buyers when active, not deleted, and has in-stock variants.
 */
export const PRODUCT_VISIBLE_WHERE: Prisma.ProductWhereInput = {
  isActive: true,
  deletedAt: null,
  variants: {
    some: {
      isActive: true,
      inventory: { availableQty: { gt: 0 }, status: 'ACTIVE' },
    },
  },
};

/** Prisma include for store discovery / deliverability checks. */
export const STORE_DISCOVERY_INCLUDE = {
  hours: true,
  storeServiceAreas: {
    include: {
      serviceArea: {
        select: { centerLat: true, centerLng: true, radiusKm: true },
      },
    },
  },
  deliveryAreas: {
    where: { isActive: true },
    select: {
      pincode: true,
      isActive: true,
      deliveryFee: true,
      minimumOrder: true,
      estimatedMinutes: true,
      priority: true,
    },
  },
} satisfies Prisma.StoreInclude;

/** Default buyer-facing discovery radius when the client does not pass radiusKm (km). */
export const DEFAULT_BUYER_DISCOVERY_RADIUS_KM = 20;

/** Use for explicit deliverability checks (checkout) — no discovery-radius cap. */
export const UNLIMITED_DISCOVERY_RADIUS_KM = Number.POSITIVE_INFINITY;

export interface BuyerLocationContext {
  lat: number;
  lng: number;
  pincode?: string | null;
  /** Discovery/search radius — pincode coverage bypasses this when configured. */
  discoveryRadiusKm?: number;
}

export interface StoreEligibilityResult {
  eligible: boolean;
  deliverable: DeliverabilityResult;
  pincodeMatch: boolean;
  filterReason?: string;
}

export function isStoreVisible(
  store: { status: StoreStatus; isActive: boolean; deletedAt: Date | null },
): boolean {
  return (
    store.status === StoreStatus.APPROVED &&
    store.isActive &&
    store.deletedAt == null
  );
}

export function isProductVisible(
  product: { isActive: boolean; deletedAt: Date | null },
  hasInStockVariant: boolean,
): boolean {
  return product.isActive && product.deletedAt == null && hasInStockVariant;
}

/**
 * Unified buyer deliverability for discovery, categories, search, and map.
 * Pincode coverage (StoreDeliveryArea) takes precedence; otherwise geo radius applies.
 * Pincode match bypasses discoveryRadiusKm (same as home discoverStores).
 */
export function canDeliverToBuyer(
  store: DeliverableStoreWithCoverage,
  ctx: BuyerLocationContext,
): StoreEligibilityResult {
  const deliverable = checkStoreDeliverabilityWithCoverage(ctx.lat, ctx.lng, store, {
    buyerPincode: ctx.pincode,
  });

  if (!deliverable.deliverable) {
    return {
      eligible: false,
      deliverable,
      pincodeMatch: false,
      filterReason: deliverable.reason ?? 'Not deliverable',
    };
  }

  const pincodeMatch = ctx.pincode
    ? Boolean(findActiveDeliveryArea(store.deliveryAreas, ctx.pincode))
    : false;

  const discoveryRadiusKm = ctx.discoveryRadiusKm ?? 5;
  if (
    !pincodeMatch &&
    deliverable.distanceKm != null &&
    deliverable.distanceKm > discoveryRadiusKm
  ) {
    return {
      eligible: false,
      deliverable,
      pincodeMatch,
      filterReason: `Outside discovery radius (${deliverable.distanceKm} km > ${discoveryRadiusKm} km)`,
    };
  }

  return { eligible: true, deliverable, pincodeMatch };
}

export function toDeliverableStoreShape(
  store: {
    latitude: number;
    longitude: number;
    deliveryRadiusKm?: number | null;
    storeServiceAreas?: DeliverableStoreWithCoverage['storeServiceAreas'];
    deliveryAreas?: DeliverableStoreWithCoverage['deliveryAreas'];
    deliveryFee?: unknown;
    minOrderAmount?: unknown;
    avgPrepTimeMins?: number;
  },
): DeliverableStoreWithCoverage {
  return {
    latitude: store.latitude,
    longitude: store.longitude,
    deliveryRadiusKm: store.deliveryRadiusKm ?? 5,
    storeServiceAreas: store.storeServiceAreas ?? [],
    deliveryAreas: store.deliveryAreas,
    deliveryFee: store.deliveryFee as DeliverableStoreWithCoverage['deliveryFee'],
    minOrderAmount: store.minOrderAmount as DeliverableStoreWithCoverage['minOrderAmount'],
    avgPrepTimeMins: store.avgPrepTimeMins,
  };
}

export function resolveBuyerDeliveryTerms(
  store: DeliverableStoreWithCoverage,
  pincode?: string | null,
) {
  return resolveDeliveryTerms(store, pincode);
}
