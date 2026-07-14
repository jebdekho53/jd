export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface StoreAddress {
  line1: string;
  line2: string | null;
  pincode: string;
}

export interface StoreCard {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  address: StoreAddress;
  ratingAvg: number;
  ratingCount: number;
  deliveryFee: number;
  minOrderAmount: number;
  avgPrepTimeMins: number;
  distanceKm: number;
  isOpen: boolean;
  todayHours: { openTime: string; closeTime: string } | null;
}

export interface StoreDetail extends StoreCard {
  phone: string | null;
  email: string | null;
  latitude?: number;
  longitude?: number;
  city?: string | null;
  locality?: string | null;
  storeType?: string;
  hours: { day: string; openTime: string; closeTime: string; isClosed: boolean }[];
  serviceAreas: { id: string; name: string; pincode: string | null }[];
  categories: { id: string; name: string; slug: string }[];
  productCount: number;
  verifications?: { gst: boolean; kyc: boolean; fssai: boolean };
  merchantSince?: string;
  deliveryRadiusKm?: number;
}

export interface BuyerVariant {
  id: string;
  name: string;
  price: number;
  mrp: number | null;
  weightGrams: number | null;
  size?: string | null;
  color?: string | null;
  isDefault: boolean;
  availableQty: number;
}

import type { ReturnPolicySummary } from './return-policy';

export interface BuyerProductMetadata {
  ingredients: string | null;
  shelfLife: string | null;
  countryOfOrigin: string | null;
  manufacturerName: string | null;
  manufacturerAddress: string | null;
  fssaiLicense: string | null;
  hsnCode: string | null;
  taxInclusive: boolean;
  storageInstructions: string | null;
  disclaimer: string | null;
}

export interface BuyerProductReviewSummary {
  ratingAvg: number;
  ratingCount: number;
}

export interface BuyerProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  modelNumber?: string | null;
  warrantyMonths?: number | null;
  specifications?: { label: string; value: string }[] | null;
  imageUrls: string[];
  basePrice: number;
  mrp: number | null;
  unit: string;
  isVeg: boolean | null;
  tags: string[];
  category: { id: string; name: string; slug: string } | null;
  variants: BuyerVariant[];
  metadata?: BuyerProductMetadata;
  reviewSummary?: BuyerProductReviewSummary;
  returnPolicy?: ReturnPolicySummary;
}

export interface BuyerProductWithStore extends BuyerProduct {
  store: {
    id: string;
    name: string;
    slug: string;
    ratingAvg?: number;
    ratingCount?: number;
    avgPrepTimeMins?: number;
    distanceKm?: number | null;
    deliveryFee?: number;
    minOrderAmount?: number;
    deliveryPartner?: string;
  };
}

export interface ProductReview {
  id: string;
  productId: string;
  rating: number;
  comment: string | null;
  images: string[];
  verifiedPurchase: boolean;
  buyer: { id: string; name: string } | null;
  order: { id: string; orderNumber: string } | null;
  createdAt: string;
}

export interface ProductOffersBundle {
  productId: string;
  storePromotions: {
    id: string;
    name: string;
    description: string | null;
    offerType: string;
    badge: string;
  }[];
  campaignOffers: {
    id: string;
    name: string;
    description: string | null;
    kind: string;
    campaignName: string;
    minOrderAmount: number;
  }[];
  coupons: { id: string; code: string; name: string; minOrderAmount: number }[];
  walletCashbackPercent: number | null;
  walletCashbackEligible?: boolean;
  rewardPoints?: number | null;
  firstOrderEligible?: boolean;
  plusBenefits: string[];
  personalizedOffers?: { id: string; name: string; description: string | null; kind: string }[];
  freeDeliveryEligible: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  children: CategoryItem[];
}

export interface DiscoverStoresParams {
  lat: number;
  lng: number;
  pincode?: string;
  radiusKm?: number;
  page?: number;
  limit?: number;
  sort?: 'distance' | 'popular' | 'fast' | 'new' | 'rating';
}

export interface StoreCardWithCount extends StoreCard {
  productCount?: number;
}

export interface StoreSearchGroup {
  store: {
    id: string;
    name: string;
    slug: string;
    ratingAvg: number;
    avgPrepTimeMins: number;
  };
  products: BuyerProduct[];
  productCount: number;
}

export interface StoreProductsParams {
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface SearchProductsParams {
  q?: string;
  categoryId?: string;
  subcategoryId?: string;
  storeId?: string;
  lat?: number;
  lng?: number;
  pincode?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface UnifiedSearchProduct {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  imageUrls: string[];
  basePrice: number;
  mrp: number | null;
  category: { id: string; name: string; slug: string } | null;
  store: {
    id: string;
    name: string;
    slug: string;
    distanceKm?: number;
    ratingAvg?: number;
    avgPrepTimeMins?: number;
    etaMins?: number;
    hasOffer?: boolean;
  };
  inStock: boolean;
  availableQty: number;
  /** Default purchasable variant; required for add-to-cart from search */
  variantId?: string;
  /** True when this result is a paid (sponsored) placement. */
  sponsored?: boolean;
  /** Ad campaign id — used to record a click when the buyer taps the result. */
  campaignId?: string;
}

export interface UnifiedSearchResult {
  products: UnifiedSearchProduct[];
  stores: Array<{
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    ratingAvg: number;
    distanceKm: number;
    etaMins: number;
    hasOffer: boolean;
  }>;
  categories: Array<{ id: string; name: string; slug: string; imageUrl: string | null; parentId?: string | null }>;
  subcategories: Array<{ id: string; name: string; slug: string; imageUrl: string | null; parentId?: string | null }>;
  brands: Array<{ name: string }>;
  meta: PaginationMeta & { sort?: string; tab?: string; totalProducts: number };
}

export interface SearchSuggestionsResult {
  popularSearches: string[];
  products: Array<{ id: string; name: string; slug: string; brand: string | null; imageUrls: string[] }>;
  categories: Array<{ id: string; name: string; slug: string; imageUrl: string | null }>;
  stores: Array<{ id: string; name: string; slug: string; logoUrl: string | null }>;
}

export interface TrendingSearchResult {
  period: string;
  trending: Array<{ query: string; score: number }>;
}
