export interface OfferStoreRef {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  latitude?: number;
  longitude?: number;
}

export interface OfferProductRef {
  id: string;
  name: string;
  slug: string;
  imageUrls: string[];
  basePrice: number;
}

/** Shape of `Offer` rows serialized by OfferEngineService.serializeOffer —
 *  used by flash-sales, near-you and recommended offers. */
export interface FlashSaleOffer {
  id: string;
  campaignId: string | null;
  storeId: string;
  name: string;
  description: string | null;
  kind: string;
  target: string;
  discountValue: number;
  cashbackAmount: number | null;
  rewardPointsBonus: number | null;
  minOrderAmount: number;
  maxDiscount: number | null;
  flashQtyLimit: number | null;
  flashQtyRemaining: number | null;
  startsAt: string;
  expiresAt: string;
  badge: string;
  store: OfferStoreRef | null;
  product: OfferProductRef | null;
}

/** Shape of `StorePromotion` rows serialized by StorePromotionService —
 *  used by deals/top and deals/trending. */
export interface StorePromotionDeal {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  offerType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  store: OfferStoreRef;
  badge: string;
}

export interface FreeDeliveryDeal {
  store: OfferStoreRef & { deliveryFee: number; ratingAvg: number | null };
  promotion: StorePromotionDeal;
}
