export interface MerchantApplicationDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  uploadedAt: string;
}

export interface MerchantApplicationBankAccount {
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  upiId?: string | null;
  bankName?: string | null;
}

export interface MerchantApplicationDetail {
  id: string;
  status: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  businessName?: string | null;
  storeName?: string | null;
  gstNumber?: string | null;
  gstVerified?: boolean | null;
  panNumber?: string | null;
  storeAddress?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  documents: MerchantApplicationDocument[];
  bankAccount: MerchantApplicationBankAccount | null;
}
