export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  parentId: string | null;
}

export interface StoreCard {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  distanceKm: number | null;
  ratingAvg: number;
  ratingCount: number;
  isOpen: boolean;
  minOrderAmount: number;
  deliveryFee: number;
  avgPrepTimeMins: number;
}

export interface StoreDetail extends StoreCard {
  description: string | null;
  phone: string | null;
  address: string | null;
  deliveryMode: 'PLATFORM' | 'SELF';
  freeDeliveryThreshold: number | null;
}

export interface BuyerVariant {
  id: string;
  name: string;
  sku: string;
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
  isBestseller?: boolean;
  categoryId: string | null;
  variants: BuyerVariant[];
}

export interface BuyerProductWithStore extends BuyerProduct {
  store: {
    id: string;
    name: string;
    slug: string;
    ratingAvg: number;
    logoUrl: string | null;
  };
}
