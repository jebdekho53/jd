export type StoreStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'DOCUMENTS_REQUIRED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type RejectionType =
  | 'DOCUMENT_ISSUE'
  | 'COMPLIANCE_ISSUE'
  | 'FRAUD'
  | 'DUPLICATE_ACCOUNT'
  | 'POLICY_VIOLATION';

export type StoreDocumentType =
  | 'GST_CERTIFICATE'
  | 'PAN_CARD'
  | 'FSSAI_LICENSE'
  | 'TRADE_LICENSE'
  | 'BANK_PROOF'
  | 'OTHER';

export const REVOCABLE_REJECTION_TYPES: RejectionType[] = [
  'DOCUMENT_ISSUE',
  'COMPLIANCE_ISSUE',
];

export const BLACKLIST_REJECTION_TYPES: RejectionType[] = [
  'FRAUD',
  'DUPLICATE_ACCOUNT',
  'POLICY_VIOLATION',
];

export const REJECTION_TYPE_LABELS: Record<RejectionType, string> = {
  DOCUMENT_ISSUE: 'Document issue',
  COMPLIANCE_ISSUE: 'Compliance issue',
  FRAUD: 'Fraud',
  DUPLICATE_ACCOUNT: 'Duplicate account',
  POLICY_VIOLATION: 'Policy violation',
};

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

export const DOCUMENT_TYPE_LABELS: Record<StoreDocumentType, string> = {
  GST_CERTIFICATE: 'GST Certificate',
  PAN_CARD: 'PAN Card',
  FSSAI_LICENSE: 'FSSAI License',
  TRADE_LICENSE: 'Trade License',
  BANK_PROOF: 'Bank Proof',
  OTHER: 'Other',
};

export interface AdminStoreListItem {
  id: string;
  name: string;
  slug: string;
  status: StoreStatus;
  pincode: string;
  line1: string;
  submittedAt: string | null;
  rejectionReason: string | null;
  rejectionType: RejectionType | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  documentRequestReason: string | null;
  documentRequestAt: string | null;
  requestedDocumentTypes: StoreDocumentType[] | null;
  createdAt: string;
  merchantProfile: {
    id: string;
    businessName: string;
    gstNumber: string | null;
    panNumber?: string | null;
    kycStatus: string;
    isBlacklisted: boolean;
    blacklistReason: string | null;
    user: { id: string; phone: string; email: string | null };
  };
  _count?: { products: number; orders: number };
}

export interface AdminStoreDetail extends AdminStoreListItem {
  description: string | null;
  phone: string | null;
  email: string | null;
  line2: string | null;
  latitude: number;
  longitude: number;
  cityId: string;
  updatedAt: string;
  minOrderAmount?: number | string;
  deliveryFee?: number | string;
  rejectionRevokedAt?: string | null;
  rejectionRevokeReason?: string | null;
  verificationDocuments: StoreVerificationDocument[];
  documentRequests: StoreDocumentRequest[];
  storeZones?: Array<{ zone: { id: string; name: string; slug: string } }>;
}

export interface ListStoresParams {
  page?: number;
  limit?: number;
  status?: StoreStatus;
  blacklisted?: boolean;
}

export interface RejectStorePayload {
  reason: string;
  rejectionType: RejectionType;
}

export interface RevokeRejectionPayload {
  reason: string;
}

export interface RemoveBlacklistPayload {
  reason: string;
  reopenStoreId?: string;
}

export interface SuspendStorePayload {
  reason: string;
}

export interface RequestDocumentsPayload {
  reason: string;
  documentTypes: StoreDocumentType[];
}

export const DOCUMENT_TYPE_OPTIONS: { value: StoreDocumentType; label: string }[] = [
  { value: 'GST_CERTIFICATE', label: 'GST Certificate' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'FSSAI_LICENSE', label: 'FSSAI License' },
  { value: 'TRADE_LICENSE', label: 'Trade License' },
  { value: 'BANK_PROOF', label: 'Bank Proof' },
  { value: 'OTHER', label: 'Other' },
];

export const REJECTION_TYPE_OPTIONS: { value: RejectionType; label: string; revocable: boolean }[] = [
  { value: 'DOCUMENT_ISSUE', label: 'Document issue (revocable)', revocable: true },
  { value: 'COMPLIANCE_ISSUE', label: 'Compliance issue (revocable)', revocable: true },
  { value: 'FRAUD', label: 'Fraud (permanent blacklist)', revocable: false },
  { value: 'DUPLICATE_ACCOUNT', label: 'Duplicate account (permanent blacklist)', revocable: false },
  { value: 'POLICY_VIOLATION', label: 'Policy violation (permanent blacklist)', revocable: false },
];
