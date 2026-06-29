import type { StoreDocumentType } from './store';

export type StoreCategoryRequestStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'DOCUMENTS_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVOKED';

/** @deprecated use StoreCategoryRequestStatus */
export type MerchantCategoryStatus = StoreCategoryRequestStatus;

export interface AdminCategoryRequest {
  id: string;
  storeId: string;
  status: StoreCategoryRequestStatus;
  reason: string | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  category: { id: string; name: string; slug: string; catalogKind?: 'PRODUCT' | 'MENU' };
  subcategory: { id: string; name: string; slug: string; catalogKind?: 'PRODUCT' | 'MENU' };
  store: {
    id: string;
    name: string;
    slug: string;
    merchantProfile: {
      id: string;
      businessName: string;
      gstNumber: string | null;
      user: { id: string; phone: string; email: string | null };
    };
  };
}

export interface GlobalCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  icon: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  catalogKind?: 'PRODUCT' | 'MENU';
  parentId?: string | null;
  children: GlobalCategory[];
}

export interface CategoryStatistics {
  totalCategories: number;
  totalSubcategories: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  documentsRequiredRequests: number;
  underReviewRequests?: number;
  revokedRequests?: number;
  topCategories: Array<{ categoryId: string | null; name: string; productCount: number }>;
  storesPerCategory: Array<{ categoryId: string; name: string; storeCount: number }>;
}
