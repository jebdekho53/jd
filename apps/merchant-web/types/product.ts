export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  mrp: number | null;
  weightGrams: number | null;
  isDefault: boolean;
  isActive: boolean;
  inventory: {
    availableQty: number;
    reservedQty: number;
    soldQty: number;
    lowStockThreshold: number | null;
    status?: string;
  } | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children?: Category[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  sku: string | null;
  categoryId: string | null;
  category: Category | null;
  imageUrls: string[];
  basePrice: number;
  mrp: number | null;
  unit: string | null;
  weightGrams: number | null;
  isVeg: boolean | null;
  tags: string[];
  isActive: boolean;
  sortOrder: number;
  ingredients?: string | null;
  shelfLife?: string | null;
  countryOfOrigin?: string | null;
  manufacturerName?: string | null;
  manufacturerAddress?: string | null;
  fssaiLicense?: string | null;
  storageInstructions?: string | null;
  disclaimer?: string | null;
  taxInclusive?: boolean;
  hsnCodeId?: string | null;
  gstSlab?: string | null;
  taxCategory?: string | null;
  hsnCodeRef?: { id: string; code: string; description: string; defaultGstSlab: string } | null;
  isReturnable?: boolean;
  isRefundable?: boolean;
  isReplaceable?: boolean;
  returnWindowHours?: number | null;
  approvalMode?: string;
  proofRequired?: string;
  autoApproveBelowAmount?: number | null;
  returnReasons?: string[];
  refundMethod?: string;
  preparedFoodPolicy?: string | null;
  allowCustomerChangedMind?: boolean;
  returnPolicyText?: string | null;
  replacementPolicyText?: string | null;
  createdAt: string;
  variants: ProductVariant[];
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  brand?: string;
  sku?: string;
  categoryId?: string;
  imageUrls: string[];
  basePrice: number;
  mrp?: number;
  unit?: string;
  weightGrams?: number;
  isVeg?: boolean;
  tags?: string[];
  quantity?: number;
  lowStockThreshold?: number;
  ingredients?: string;
  shelfLife?: string;
  countryOfOrigin?: string;
  manufacturerName?: string;
  manufacturerAddress?: string;
  fssaiLicense?: string;
  storageInstructions?: string;
  disclaimer?: string;
  taxInclusive?: boolean;
  hsnCodeId?: string;
  gstSlab?: string;
  taxCategory?: 'GOODS' | 'SERVICES' | 'EXEMPT' | 'NIL_RATED';
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  isActive?: boolean;
}

export interface UpdateInventoryPayload {
  quantity: number;
  lowStockThreshold?: number;
}

export interface UpdatePricePayload {
  price: number;
  mrp?: number;
}

export interface ListProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}
