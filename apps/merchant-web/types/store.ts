export type StoreStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'DOCUMENTS_REQUIRED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type StoreDocumentType =
  | 'GST_CERTIFICATE'
  | 'PAN_CARD'
  | 'FSSAI_LICENSE'
  | 'TRADE_LICENSE'
  | 'BANK_PROOF'
  | 'OTHER';

export type RejectionType =
  | 'DOCUMENT_ISSUE'
  | 'COMPLIANCE_ISSUE'
  | 'FRAUD'
  | 'DUPLICATE_ACCOUNT'
  | 'POLICY_VIOLATION';

export const REVOCABLE_REJECTION_TYPES: RejectionType[] = [
  'DOCUMENT_ISSUE',
  'COMPLIANCE_ISSUE',
];

export interface StoreHour {
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface StoreVerificationDocument {
  id: string;
  documentType: StoreDocumentType;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  uploadedAt: string;
}

export interface StoreDocumentRequest {
  id: string;
  reason: string;
  documentTypes: StoreDocumentType[];
  requestedAt: string;
  fulfilledAt: string | null;
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
  rejectionReason: string | null;
  rejectionType: RejectionType | null;
  documentRequestReason: string | null;
  documentRequestAt: string | null;
  requestedDocumentTypes: StoreDocumentType[] | null;
  verificationDocuments: StoreVerificationDocument[];
  documentRequests: StoreDocumentRequest[];
  merchantProfile?: {
    id: string;
    isBlacklisted: boolean;
    blacklistReason: string | null;
    businessName: string;
  };
  createdAt: string;
  updatedAt: string;
  hours: StoreHour[];
}

export interface CreateStorePayload {
  name: string;
  description?: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string;
  pincode: string;
  latitude: number;
  longitude: number;
  logoUrl: string;
  bannerUrl: string;
  locationPincodeId?: string;
  locationAreaId?: string;
  locationCityId?: string;
  cityId: string;
  zoneIds?: string[];
  minOrderAmount?: number;
  deliveryFee?: number;
  avgPrepTimeMins?: number;
}

export interface UpdateStorePayload extends Partial<CreateStorePayload> {
  isActive?: boolean;
  hours?: StoreHour[];
}

export interface UploadVerificationDocumentPayload {
  documentType: StoreDocumentType;
  fileName: string;
  mimeType: string;
  fileUrl: string;
}

export const DOCUMENT_TYPE_LABELS: Record<StoreDocumentType, string> = {
  GST_CERTIFICATE: 'GST Certificate',
  PAN_CARD: 'PAN Card',
  FSSAI_LICENSE: 'FSSAI License',
  TRADE_LICENSE: 'Trade License',
  BANK_PROOF: 'Bank Proof',
  OTHER: 'Other Document',
};
