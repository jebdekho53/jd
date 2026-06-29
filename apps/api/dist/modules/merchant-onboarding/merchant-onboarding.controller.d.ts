import { RequestUser } from '../../common/types';
import { MerchantOnboardingService } from './merchant-onboarding.service';
import { FranchiseLeadDto, ResolveStoreLocationDto, SaveBankAccountDto, UpdateOnboardingStepDto, UploadMerchantDocumentDto, ValidateGstDto } from './dto/merchant-onboarding.dto';
export declare class MerchantOnboardingController {
    private readonly onboarding;
    constructor(onboarding: MerchantOnboardingService);
    getStats(): Promise<{
        success: boolean;
        data: {
            activeCustomers: number;
            ordersDelivered: number;
            citiesServed: number;
            merchantPartners: number;
        };
    }>;
    getApplication(user: RequestUser): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.MerchantApplicationStatus;
            ownerName: string | null;
            ownerEmail: string | null;
            ownerPhone: string | null;
            businessName: string | null;
            businessType: import("@prisma/client").$Enums.MerchantBusinessType | null;
            businessTypes: import("@prisma/client").$Enums.VerticalBusinessType[];
            gstNumber: string | null;
            gstVerified: boolean;
            panNumber: string | null;
            storeName: string | null;
            storeAddress: string | null;
            state: string | null;
            city: string | null;
            cityId: string | null;
            pincode: string | null;
            latitude: number | null;
            longitude: number | null;
            deliveryRadiusKm: number | null;
            storeLogoUrl: string | null;
            storeBannerUrl: string | null;
            deliveryCoveragePincodes: import("@prisma/client/runtime/library").JsonValue;
            riskScore: number;
            riskFlags: import("@prisma/client/runtime/library").JsonValue;
            rejectionReason: string | null;
            adminNotes: string | null;
            submittedAt: Date | null;
            reviewedAt: Date | null;
            documents: {
                id: string;
                documentType: import("@prisma/client").$Enums.MerchantDocumentType;
                fileName: string;
                mimeType: string;
                fileUrl: string;
                uploadedAt: Date;
                applicationId: string;
            }[];
            kyc: {
                id: string;
                status: import("@prisma/client").$Enums.MerchantKycStatus;
                createdAt: Date;
                updatedAt: Date;
                verifiedAt: Date | null;
                verifiedBy: string | null;
                notes: string | null;
                applicationId: string;
            } | null;
            bankAccount: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                applicationId: string;
                accountHolderName: string;
                accountNumber: string;
                ifsc: string;
                bankName: string | null;
                upiId: string | null;
            } | null;
            steps: {
                data: import("@prisma/client/runtime/library").JsonValue | null;
                id: string;
                completedAt: Date | null;
                applicationId: string;
                completed: boolean;
                stepKey: import("@prisma/client").$Enums.MerchantOnboardingStepKey;
            }[];
            store: {
                id: string;
                status: import("@prisma/client").$Enums.StoreStatus;
                name: string;
            } | null;
            merchantProfile: {
                id: string;
                businessName: string;
                kycStatus: import("@prisma/client").$Enums.KycStatus;
                isBlacklisted: boolean;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    resolveLocation(user: RequestUser, dto: ResolveStoreLocationDto): Promise<{
        success: boolean;
        data: {
            pincode: string;
            city: string;
            state: string;
            locality: string;
            latitude: number;
            longitude: number;
            cityId: string;
            operationalCityName: string;
            locationPincodeId: string | undefined;
            locationAreaId: string | undefined;
            locationCityId: string | undefined;
            inMasterDirectory: boolean;
            expansionArea: boolean;
        };
    }>;
    updateStep(user: RequestUser, dto: UpdateOnboardingStepDto, ip: string): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.MerchantApplicationStatus;
            ownerName: string | null;
            ownerEmail: string | null;
            ownerPhone: string | null;
            businessName: string | null;
            businessType: import("@prisma/client").$Enums.MerchantBusinessType | null;
            businessTypes: import("@prisma/client").$Enums.VerticalBusinessType[];
            gstNumber: string | null;
            gstVerified: boolean;
            panNumber: string | null;
            storeName: string | null;
            storeAddress: string | null;
            state: string | null;
            city: string | null;
            cityId: string | null;
            pincode: string | null;
            latitude: number | null;
            longitude: number | null;
            deliveryRadiusKm: number | null;
            storeLogoUrl: string | null;
            storeBannerUrl: string | null;
            deliveryCoveragePincodes: import("@prisma/client/runtime/library").JsonValue;
            riskScore: number;
            riskFlags: import("@prisma/client/runtime/library").JsonValue;
            rejectionReason: string | null;
            adminNotes: string | null;
            submittedAt: Date | null;
            reviewedAt: Date | null;
            documents: {
                id: string;
                documentType: import("@prisma/client").$Enums.MerchantDocumentType;
                fileName: string;
                mimeType: string;
                fileUrl: string;
                uploadedAt: Date;
                applicationId: string;
            }[];
            kyc: {
                id: string;
                status: import("@prisma/client").$Enums.MerchantKycStatus;
                createdAt: Date;
                updatedAt: Date;
                verifiedAt: Date | null;
                verifiedBy: string | null;
                notes: string | null;
                applicationId: string;
            } | null;
            bankAccount: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                applicationId: string;
                accountHolderName: string;
                accountNumber: string;
                ifsc: string;
                bankName: string | null;
                upiId: string | null;
            } | null;
            steps: {
                data: import("@prisma/client/runtime/library").JsonValue | null;
                id: string;
                completedAt: Date | null;
                applicationId: string;
                completed: boolean;
                stepKey: import("@prisma/client").$Enums.MerchantOnboardingStepKey;
            }[];
            store: {
                id: string;
                status: import("@prisma/client").$Enums.StoreStatus;
                name: string;
            } | null;
            merchantProfile: {
                id: string;
                businessName: string;
                kycStatus: import("@prisma/client").$Enums.KycStatus;
                isBlacklisted: boolean;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    uploadDocument(user: RequestUser, dto: UploadMerchantDocumentDto): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.MerchantApplicationStatus;
            ownerName: string | null;
            ownerEmail: string | null;
            ownerPhone: string | null;
            businessName: string | null;
            businessType: import("@prisma/client").$Enums.MerchantBusinessType | null;
            businessTypes: import("@prisma/client").$Enums.VerticalBusinessType[];
            gstNumber: string | null;
            gstVerified: boolean;
            panNumber: string | null;
            storeName: string | null;
            storeAddress: string | null;
            state: string | null;
            city: string | null;
            cityId: string | null;
            pincode: string | null;
            latitude: number | null;
            longitude: number | null;
            deliveryRadiusKm: number | null;
            storeLogoUrl: string | null;
            storeBannerUrl: string | null;
            deliveryCoveragePincodes: import("@prisma/client/runtime/library").JsonValue;
            riskScore: number;
            riskFlags: import("@prisma/client/runtime/library").JsonValue;
            rejectionReason: string | null;
            adminNotes: string | null;
            submittedAt: Date | null;
            reviewedAt: Date | null;
            documents: {
                id: string;
                documentType: import("@prisma/client").$Enums.MerchantDocumentType;
                fileName: string;
                mimeType: string;
                fileUrl: string;
                uploadedAt: Date;
                applicationId: string;
            }[];
            kyc: {
                id: string;
                status: import("@prisma/client").$Enums.MerchantKycStatus;
                createdAt: Date;
                updatedAt: Date;
                verifiedAt: Date | null;
                verifiedBy: string | null;
                notes: string | null;
                applicationId: string;
            } | null;
            bankAccount: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                applicationId: string;
                accountHolderName: string;
                accountNumber: string;
                ifsc: string;
                bankName: string | null;
                upiId: string | null;
            } | null;
            steps: {
                data: import("@prisma/client/runtime/library").JsonValue | null;
                id: string;
                completedAt: Date | null;
                applicationId: string;
                completed: boolean;
                stepKey: import("@prisma/client").$Enums.MerchantOnboardingStepKey;
            }[];
            store: {
                id: string;
                status: import("@prisma/client").$Enums.StoreStatus;
                name: string;
            } | null;
            merchantProfile: {
                id: string;
                businessName: string;
                kycStatus: import("@prisma/client").$Enums.KycStatus;
                isBlacklisted: boolean;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    saveBank(user: RequestUser, dto: SaveBankAccountDto): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.MerchantApplicationStatus;
            ownerName: string | null;
            ownerEmail: string | null;
            ownerPhone: string | null;
            businessName: string | null;
            businessType: import("@prisma/client").$Enums.MerchantBusinessType | null;
            businessTypes: import("@prisma/client").$Enums.VerticalBusinessType[];
            gstNumber: string | null;
            gstVerified: boolean;
            panNumber: string | null;
            storeName: string | null;
            storeAddress: string | null;
            state: string | null;
            city: string | null;
            cityId: string | null;
            pincode: string | null;
            latitude: number | null;
            longitude: number | null;
            deliveryRadiusKm: number | null;
            storeLogoUrl: string | null;
            storeBannerUrl: string | null;
            deliveryCoveragePincodes: import("@prisma/client/runtime/library").JsonValue;
            riskScore: number;
            riskFlags: import("@prisma/client/runtime/library").JsonValue;
            rejectionReason: string | null;
            adminNotes: string | null;
            submittedAt: Date | null;
            reviewedAt: Date | null;
            documents: {
                id: string;
                documentType: import("@prisma/client").$Enums.MerchantDocumentType;
                fileName: string;
                mimeType: string;
                fileUrl: string;
                uploadedAt: Date;
                applicationId: string;
            }[];
            kyc: {
                id: string;
                status: import("@prisma/client").$Enums.MerchantKycStatus;
                createdAt: Date;
                updatedAt: Date;
                verifiedAt: Date | null;
                verifiedBy: string | null;
                notes: string | null;
                applicationId: string;
            } | null;
            bankAccount: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                applicationId: string;
                accountHolderName: string;
                accountNumber: string;
                ifsc: string;
                bankName: string | null;
                upiId: string | null;
            } | null;
            steps: {
                data: import("@prisma/client/runtime/library").JsonValue | null;
                id: string;
                completedAt: Date | null;
                applicationId: string;
                completed: boolean;
                stepKey: import("@prisma/client").$Enums.MerchantOnboardingStepKey;
            }[];
            store: {
                id: string;
                status: import("@prisma/client").$Enums.StoreStatus;
                name: string;
            } | null;
            merchantProfile: {
                id: string;
                businessName: string;
                kycStatus: import("@prisma/client").$Enums.KycStatus;
                isBlacklisted: boolean;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    validateGst(dto: ValidateGstDto): {
        success: boolean;
        data: {
            gstNumber: string;
            valid: boolean;
            message: string;
        };
    };
    submit(user: RequestUser, ip: string): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.MerchantApplicationStatus;
            ownerName: string | null;
            ownerEmail: string | null;
            ownerPhone: string | null;
            businessName: string | null;
            businessType: import("@prisma/client").$Enums.MerchantBusinessType | null;
            businessTypes: import("@prisma/client").$Enums.VerticalBusinessType[];
            gstNumber: string | null;
            gstVerified: boolean;
            panNumber: string | null;
            storeName: string | null;
            storeAddress: string | null;
            state: string | null;
            city: string | null;
            cityId: string | null;
            pincode: string | null;
            latitude: number | null;
            longitude: number | null;
            deliveryRadiusKm: number | null;
            storeLogoUrl: string | null;
            storeBannerUrl: string | null;
            deliveryCoveragePincodes: import("@prisma/client/runtime/library").JsonValue;
            riskScore: number;
            riskFlags: import("@prisma/client/runtime/library").JsonValue;
            rejectionReason: string | null;
            adminNotes: string | null;
            submittedAt: Date | null;
            reviewedAt: Date | null;
            documents: {
                id: string;
                documentType: import("@prisma/client").$Enums.MerchantDocumentType;
                fileName: string;
                mimeType: string;
                fileUrl: string;
                uploadedAt: Date;
                applicationId: string;
            }[];
            kyc: {
                id: string;
                status: import("@prisma/client").$Enums.MerchantKycStatus;
                createdAt: Date;
                updatedAt: Date;
                verifiedAt: Date | null;
                verifiedBy: string | null;
                notes: string | null;
                applicationId: string;
            } | null;
            bankAccount: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                applicationId: string;
                accountHolderName: string;
                accountNumber: string;
                ifsc: string;
                bankName: string | null;
                upiId: string | null;
            } | null;
            steps: {
                data: import("@prisma/client/runtime/library").JsonValue | null;
                id: string;
                completedAt: Date | null;
                applicationId: string;
                completed: boolean;
                stepKey: import("@prisma/client").$Enums.MerchantOnboardingStepKey;
            }[];
            store: {
                id: string;
                status: import("@prisma/client").$Enums.StoreStatus;
                name: string;
            } | null;
            merchantProfile: {
                id: string;
                businessName: string;
                kycStatus: import("@prisma/client").$Enums.KycStatus;
                isBlacklisted: boolean;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    status(user: RequestUser): Promise<{
        success: boolean;
        data: {
            hasApplication: boolean;
            tracker: never[];
            applicationId?: undefined;
            status?: undefined;
            storeStatus?: undefined;
            riskScore?: undefined;
            progressPct?: undefined;
        } | {
            hasApplication: boolean;
            applicationId: string;
            status: import("@prisma/client").$Enums.MerchantApplicationStatus;
            storeStatus: import("@prisma/client").$Enums.StoreStatus | undefined;
            riskScore: number;
            tracker: {
                key: string;
                label: string;
                done: boolean;
            }[];
            progressPct: number;
        };
    }>;
    checklist(user: RequestUser): Promise<{
        success: boolean;
        data: {
            items: {
                key: string;
                label: string;
                done: boolean;
            }[];
            progressPct: number;
        };
    }>;
    franchiseLead(user: RequestUser, dto: FranchiseLeadDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
