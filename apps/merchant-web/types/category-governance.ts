export type StoreCategoryRequestStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'DOCUMENTS_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVOKED';

/** @deprecated use StoreCategoryRequestStatus */
export type MerchantCategoryStatus = StoreCategoryRequestStatus;

export type StoreDocumentType =
  | 'GST_CERTIFICATE'
  | 'PAN_CARD'
  | 'FSSAI_LICENSE'
  | 'TRADE_LICENSE'
  | 'BANK_PROOF'
  | 'OTHER';

export type CategoryCatalogKind = 'PRODUCT' | 'MENU';

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  catalogKind?: CategoryCatalogKind;
  requestStatus: StoreCategoryRequestStatus | null;
  children: Array<{
    id: string;
    name: string;
    slug: string;
    catalogKind?: CategoryCatalogKind;
    requestStatus: StoreCategoryRequestStatus | null;
  }>;
}

export interface StoreCategoryRequest {
  id: string;
  storeId: string;
  status: StoreCategoryRequestStatus;
  reason: string | null;
  adminNote: string | null;
  createdAt: string;
  category: { id: string; name: string; slug: string };
  subcategory: { id: string; name: string; slug: string };
  store?: { id: string; name: string; slug: string };
}

/** @deprecated use StoreCategoryRequest */
export type MerchantCategoryRequest = StoreCategoryRequest;

export const DOCUMENT_TYPE_LABELS: Record<StoreDocumentType, string> = {
  GST_CERTIFICATE: 'GST Certificate',
  PAN_CARD: 'PAN Card',
  FSSAI_LICENSE: 'FSSAI License',
  TRADE_LICENSE: 'Trade License',
  BANK_PROOF: 'Bank Proof',
  OTHER: 'Other',
};
