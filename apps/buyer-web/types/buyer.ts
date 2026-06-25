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
  isDefault: boolean;
  availableQty: number;
}

export interface BuyerProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  imageUrls: string[];
  basePrice: number;
  mrp: number | null;
  unit: string;
  isVeg: boolean | null;
  tags: string[];
  category: { id: string; name: string; slug: string } | null;
  variants: BuyerVariant[];
}

export interface BuyerProductWithStore extends BuyerProduct {
  store: { id: string; name: string; slug: string };
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
}

export interface UnifiedSearchResult {
  products: UnifiedSearchProduct[];
  stores: Array<{
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
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
