import { MerchantBusinessType, MerchantDocumentType, MerchantOnboardingStepKey } from '@prisma/client';
export declare class ResolveStoreLocationDto {
    locality?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude: number;
    longitude: number;
    locationCityId?: string;
    locationAreaId?: string;
}
export declare class PickupAddressDto {
    addressLine1: string;
    addressLine2?: string;
    locality: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    pickupInstructions?: string;
    googlePlaceId?: string;
    formattedAddress?: string;
}
export declare class UpdateOnboardingStepDto {
    stepKey?: MerchantOnboardingStepKey;
    ownerName?: string;
    ownerEmail?: string;
    ownerPhone?: string;
    contactMobile?: string;
    ownerFullName?: string;
    password?: string;
    businessName?: string;
    legalName?: string;
    businessType?: MerchantBusinessType;
    businessTypes?: MerchantBusinessType[];
    gstNumber?: string;
    gstin?: string;
    panNumber?: string;
    pan?: string;
    storeName?: string;
    storeDescription?: string;
    storeEmail?: string;
    storePhone?: string;
    storeAddress?: string;
    addressLine?: string;
    pickupAddress?: PickupAddressDto;
    state?: string;
    city?: string;
    cityId?: string;
    pincode?: string;
    locality?: string;
    area?: string;
    locationPincodeId?: string;
    locationAreaId?: string;
    locationCityId?: string;
    latitude?: number;
    longitude?: number;
    deliveryRadiusKm?: number;
    deliveryRadius?: number;
    operationalCity?: string;
    deliveryMethod?: string;
    deliveryProvider?: string;
    storeLogoUrl?: string;
    storeBannerUrl?: string;
    deliveryCoveragePincodes?: string[];
    deliveryPincodes?: string[];
    selectedCategories?: string[];
    categories?: string[];
    accountHolderName?: string;
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
    branch?: string;
    accountType?: string;
    cancelledChequeUrl?: string;
    declarationAccepted?: boolean;
    submittedForApproval?: boolean;
}
export declare class UploadMerchantDocumentDto {
    documentType: MerchantDocumentType;
    fileName: string;
    mimeType: string;
    fileUrl: string;
}
export declare class SaveBankAccountDto {
    accountHolderName: string;
    accountNumber: string;
    ifsc: string;
    upiId?: string;
    bankName?: string;
}
export declare class ValidateGstDto {
    gstNumber: string;
}
export declare class FranchiseLeadDto {
    contactName: string;
    city: string;
    message?: string;
}
export declare class ListMerchantApplicationsDto {
    status?: string;
    page?: number;
    limit?: number;
}
export declare class RejectApplicationDto {
    reason: string;
}
export declare class RequestApplicationDocumentsDto {
    reason: string;
    documentTypes: MerchantDocumentType[];
}
export declare class RequestApplicationChangesDto {
    message: string;
}
export declare class ScheduleCallDto {
    notes: string;
    scheduledAt?: string;
}
