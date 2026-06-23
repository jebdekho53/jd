export type StoreStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface StoreHour {
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  status: StoreStatus;
  isActive: boolean;
  logoUrl: string | null;
  bannerUrl: string | null;
  line1: string;
  line2: string | null;
  pincode: string;
  latitude: number;
  longitude: number;
  cityId: string;
  minOrderAmount: number;
  deliveryFee: number;
  avgPrepTimeMins: number;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  hours: StoreHour[];
}

export interface CreateStorePayload {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  line1: string;
  line2?: string;
  pincode: string;
  latitude: number;
  longitude: number;
  cityId: string;
  minOrderAmount?: number;
  deliveryFee?: number;
  avgPrepTimeMins?: number;
}

export interface UpdateStorePayload extends Partial<CreateStorePayload> {
  isActive?: boolean;
  hours?: StoreHour[];
}
