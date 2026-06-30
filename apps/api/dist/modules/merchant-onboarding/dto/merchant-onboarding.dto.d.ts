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
    stepKey: MerchantOnboardingStepKey;
    ownerName?: string;
    ownerEmail?: string;
    ownerPhone?: string;
    password?: string;
    businessName?: string;
    businessType?: MerchantBusinessType;
    businessTypes?: MerchantBusinessType[];
    gstNumber?: string;
    panNumber?: string;
    storeName?: string;
    storeAddress?: string;
    pickupAddress?: PickupAddressDto;
    state?: string;
    city?: string;
    cityId?: string;
    pincode?: string;
    locality?: string;
    locationPincodeId?: string;
    locationAreaId?: string;
    locationCityId?: string;
    latitude?: number;
    longitude?: number;
    deliveryRadiusKm?: number;
    storeLogoUrl?: string;
    storeBannerUrl?: string;
    deliveryCoveragePincodes?: string[];
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
