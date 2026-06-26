import { Injectable } from '@nestjs/common';
import {
  BuyerLocationContext,
  canDeliverToBuyer,
  isProductVisible,
  isStoreVisible,
  DEFAULT_BUYER_DISCOVERY_RADIUS_KM,
  PRODUCT_VISIBLE_WHERE,
  resolveBuyerDeliveryTerms,
  STORE_DISCOVERY_INCLUDE,
  STORE_VISIBLE_WHERE,
  StoreEligibilityResult,
  UNLIMITED_DISCOVERY_RADIUS_KM,
} from './buyer-visibility.util';
import type { DeliverableStoreWithCoverage } from '../../common/utils/delivery-coverage.util';

/**
 * Single source of truth for buyer-facing store/product visibility and delivery eligibility.
 * Injectable wrapper — underlying logic lives in buyer-visibility.util.ts for use in catalog helpers.
 */
@Injectable()
export class BuyerVisibilityService {
  readonly storeVisibleWhere = STORE_VISIBLE_WHERE;
  readonly productVisibleWhere = PRODUCT_VISIBLE_WHERE;
  readonly storeDiscoveryInclude = STORE_DISCOVERY_INCLUDE;
  readonly defaultDiscoveryRadiusKm = DEFAULT_BUYER_DISCOVERY_RADIUS_KM;

  isStoreVisible = isStoreVisible;
  isProductVisible = isProductVisible;

  canDeliverToBuyer(
    store: DeliverableStoreWithCoverage,
    ctx: BuyerLocationContext,
  ): StoreEligibilityResult {
    return canDeliverToBuyer(store, ctx);
  }

  resolveDeliveryTerms(
    store: DeliverableStoreWithCoverage,
    pincode?: string | null,
  ) {
    return resolveBuyerDeliveryTerms(store, pincode);
  }
}
