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
  createdAt: string;
  variants: ProductVariant[];
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  brand?: string;
  sku?: string;
  categoryId?: string;
  imageUrls?: string[];
  basePrice: number;
  mrp?: number;
  unit?: string;
  weightGrams?: number;
  isVeg?: boolean;
  tags?: string[];
  quantity?: number;
  lowStockThreshold?: number;
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
