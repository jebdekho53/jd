export interface AdminStoreProductItem {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  basePrice: number;
  mrp: number | null;
  isActive: boolean;
  category: { id: string; name: string; slug: string } | null;
  totalStock: number;
  createdAt: string;
}

export interface ListStoreProductsParams {
  storeId: string;
  categoryId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
