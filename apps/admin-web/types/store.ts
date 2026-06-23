export type StoreStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface AdminStoreListItem {
  id: string;
  name: string;
  slug: string;
  status: StoreStatus;
  pincode: string;
  createdAt: string;
  merchant: {
    id: string;
    displayName: string;
    phone: string;
  };
}

export interface AdminStoreDetail extends AdminStoreListItem {
  description: string | null;
  phone: string | null;
  email: string | null;
  line1: string;
  line2: string | null;
  latitude: number;
  longitude: number;
  reviewNote: string | null;
  approvedAt: string | null;
  updatedAt: string;
}

export interface ListStoresParams {
  page?: number;
  limit?: number;
  status?: StoreStatus;
}

export interface RejectStorePayload {
  reason: string;
}

export interface SuspendStorePayload {
  reason: string;
}
