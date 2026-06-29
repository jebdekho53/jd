import { Request } from 'express';
import { RequestUser } from '../../common/types';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ListStoresDto } from './dto/list-stores.dto';
import { UploadVerificationDocumentDto } from './dto/upload-verification-document.dto';
export declare class StoreController {
    private readonly storeService;
    constructor(storeService: StoreService);
    createStore(user: RequestUser, dto: CreateStoreDto, ip: string): Promise<{
        success: boolean;
        data: {
            phone: string | null;
            email: string | null;
            id: string;
            status: import("@prisma/client").$Enums.StoreStatus;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            deliveryFee: import("@prisma/client/runtime/library").Decimal;
            minOrderAmount: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            ratingAvg: number;
            ratingCount: number;
            latitude: number;
            longitude: number;
            submittedAt: Date | null;
            rejectionReason: string | null;
            merchantProfileId: string;
            cityId: string;
            slug: string;
            logoUrl: string | null;
            bannerUrl: string | null;
            line1: string;
            line2: string | null;
            pincode: string;
            locality: string | null;
            locationPincodeId: string | null;
            locationAreaId: string | null;
            locationCityId: string | null;
            deliveryRadiusKm: number;
            storeType: import("@prisma/client").$Enums.StoreType;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            rejectionType: import("@prisma/client").$Enums.RejectionType | null;
            rejectionRevokedAt: Date | null;
            rejectionRevokedBy: string | null;
            rejectionRevokeReason: string | null;
            documentRequestReason: string | null;
            documentRequestAt: Date | null;
            documentRequestBy: string | null;
            requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
            avgPrepTimeMins: number;
            reputationStats: import("@prisma/client/runtime/library").JsonValue | null;
        } & {
            hours: import("@prisma/client").StoreHour[];
            storeZones: Array<{
                zone: {
                    id: string;
                    name: string;
                    slug: string;
                };
            }>;
            storeServiceAreas: Array<{
                serviceArea: {
                    id: string;
                    name: string;
                    slug: string;
                };
            }>;
            verificationDocuments: Array<{
                id: string;
                documentType: import("@prisma/client").StoreDocumentType;
                fileName: string;
                fileUrl: string;
                mimeType: string;
                uploadedAt: Date;
            }>;
            documentRequests: Array<{
                id: string;
                reason: string;
                documentTypes: unknown;
                requestedAt: Date;
                fulfilledAt: Date | null;
            }>;
            merchantProfile?: {
                id: string;
                isBlacklisted: boolean;
                blacklistReason: string | null;
                businessName: string;
            };
        };
    }>;
    listStores(user: RequestUser, query: ListStoresDto): Promise<{
        success: boolean;
        data: ({
            phone: string | null;
            email: string | null;
            id: string;
            status: import("@prisma/client").$Enums.StoreStatus;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            deliveryFee: import("@prisma/client/runtime/library").Decimal;
            minOrderAmount: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            ratingAvg: number;
            ratingCount: number;
            latitude: number;
            longitude: number;
            submittedAt: Date | null;
            rejectionReason: string | null;
            merchantProfileId: string;
            cityId: string;
            slug: string;
            logoUrl: string | null;
            bannerUrl: string | null;
            line1: string;
            line2: string | null;
            pincode: string;
            locality: string | null;
            locationPincodeId: string | null;
            locationAreaId: string | null;
            locationCityId: string | null;
            deliveryRadiusKm: number;
            storeType: import("@prisma/client").$Enums.StoreType;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            rejectionType: import("@prisma/client").$Enums.RejectionType | null;
            rejectionRevokedAt: Date | null;
            rejectionRevokedBy: string | null;
            rejectionRevokeReason: string | null;
            documentRequestReason: string | null;
            documentRequestAt: Date | null;
            documentRequestBy: string | null;
            requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
            avgPrepTimeMins: number;
            reputationStats: import("@prisma/client/runtime/library").JsonValue | null;
        } & {
            hours: import("@prisma/client").StoreHour[];
            storeZones: Array<{
                zone: {
                    id: string;
                    name: string;
                    slug: string;
                };
            }>;
            storeServiceAreas: Array<{
                serviceArea: {
                    id: string;
                    name: string;
                    slug: string;
                };
            }>;
            verificationDocuments: Array<{
                id: string;
                documentType: import("@prisma/client").StoreDocumentType;
                fileName: string;
                fileUrl: string;
                mimeType: string;
                uploadedAt: Date;
            }>;
            documentRequests: Array<{
                id: string;
                reason: string;
                documentTypes: unknown;
                requestedAt: Date;
                fulfilledAt: Date | null;
            }>;
            merchantProfile?: {
                id: string;
                isBlacklisted: boolean;
                blacklistReason: string | null;
                businessName: string;
            };
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getStore(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: {
            phone: string | null;
            email: string | null;
            id: string;
            status: import("@prisma/client").$Enums.StoreStatus;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            deliveryFee: import("@prisma/client/runtime/library").Decimal;
            minOrderAmount: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            ratingAvg: number;
            ratingCount: number;
            latitude: number;
            longitude: number;
            submittedAt: Date | null;
            rejectionReason: string | null;
            merchantProfileId: string;
            cityId: string;
            slug: string;
            logoUrl: string | null;
            bannerUrl: string | null;
            line1: string;
            line2: string | null;
            pincode: string;
            locality: string | null;
            locationPincodeId: string | null;
            locationAreaId: string | null;
            locationCityId: string | null;
            deliveryRadiusKm: number;
            storeType: import("@prisma/client").$Enums.StoreType;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            rejectionType: import("@prisma/client").$Enums.RejectionType | null;
            rejectionRevokedAt: Date | null;
            rejectionRevokedBy: string | null;
            rejectionRevokeReason: string | null;
            documentRequestReason: string | null;
            documentRequestAt: Date | null;
            documentRequestBy: string | null;
            requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
            avgPrepTimeMins: number;
            reputationStats: import("@prisma/client/runtime/library").JsonValue | null;
        } & {
            hours: import("@prisma/client").StoreHour[];
            storeZones: Array<{
                zone: {
                    id: string;
                    name: string;
                    slug: string;
                };
            }>;
            storeServiceAreas: Array<{
                serviceArea: {
                    id: string;
                    name: string;
                    slug: string;
                };
            }>;
            verificationDocuments: Array<{
                id: string;
                documentType: import("@prisma/client").StoreDocumentType;
                fileName: string;
                fileUrl: string;
                mimeType: string;
                uploadedAt: Date;
            }>;
            documentRequests: Array<{
                id: string;
                reason: string;
                documentTypes: unknown;
                requestedAt: Date;
                fulfilledAt: Date | null;
            }>;
            merchantProfile?: {
                id: string;
                isBlacklisted: boolean;
                blacklistReason: string | null;
                businessName: string;
            };
        };
    }>;
    updateStore(user: RequestUser, storeId: string, dto: UpdateStoreDto, ip: string): Promise<{
        success: boolean;
        data: {
            phone: string | null;
            email: string | null;
            id: string;
            status: import("@prisma/client").$Enums.StoreStatus;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            deliveryFee: import("@prisma/client/runtime/library").Decimal;
            minOrderAmount: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            ratingAvg: number;
            ratingCount: number;
            latitude: number;
            longitude: number;
            submittedAt: Date | null;
            rejectionReason: string | null;
            merchantProfileId: string;
            cityId: string;
            slug: string;
            logoUrl: string | null;
            bannerUrl: string | null;
            line1: string;
            line2: string | null;
            pincode: string;
            locality: string | null;
            locationPincodeId: string | null;
            locationAreaId: string | null;
            locationCityId: string | null;
            deliveryRadiusKm: number;
            storeType: import("@prisma/client").$Enums.StoreType;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            rejectionType: import("@prisma/client").$Enums.RejectionType | null;
            rejectionRevokedAt: Date | null;
            rejectionRevokedBy: string | null;
            rejectionRevokeReason: string | null;
            documentRequestReason: string | null;
            documentRequestAt: Date | null;
            documentRequestBy: string | null;
            requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
            avgPrepTimeMins: number;
            reputationStats: import("@prisma/client/runtime/library").JsonValue | null;
        } & {
            hours: import("@prisma/client").StoreHour[];
            storeZones: Array<{
                zone: {
                    id: string;
                    name: string;
                    slug: string;
                };
            }>;
            storeServiceAreas: Array<{
                serviceArea: {
                    id: string;
                    name: string;
                    slug: string;
                };
            }>;
            verificationDocuments: Array<{
                id: string;
                documentType: import("@prisma/client").StoreDocumentType;
                fileName: string;
                fileUrl: string;
                mimeType: string;
                uploadedAt: Date;
            }>;
            documentRequests: Array<{
                id: string;
                reason: string;
                documentTypes: unknown;
                requestedAt: Date;
                fulfilledAt: Date | null;
            }>;
            merchantProfile?: {
                id: string;
                isBlacklisted: boolean;
                blacklistReason: string | null;
                businessName: string;
            };
        };
    }>;
    submitForReview(user: RequestUser, storeId: string, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            phone: string | null;
            email: string | null;
            id: string;
            status: import("@prisma/client").$Enums.StoreStatus;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            deliveryFee: import("@prisma/client/runtime/library").Decimal;
            minOrderAmount: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            ratingAvg: number;
            ratingCount: number;
            latitude: number;
            longitude: number;
            submittedAt: Date | null;
            rejectionReason: string | null;
            merchantProfileId: string;
            cityId: string;
            slug: string;
            logoUrl: string | null;
            bannerUrl: string | null;
            line1: string;
            line2: string | null;
            pincode: string;
            locality: string | null;
            locationPincodeId: string | null;
            locationAreaId: string | null;
            locationCityId: string | null;
            deliveryRadiusKm: number;
            storeType: import("@prisma/client").$Enums.StoreType;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            rejectionType: import("@prisma/client").$Enums.RejectionType | null;
            rejectionRevokedAt: Date | null;
            rejectionRevokedBy: string | null;
            rejectionRevokeReason: string | null;
            documentRequestReason: string | null;
            documentRequestAt: Date | null;
            documentRequestBy: string | null;
            requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
            avgPrepTimeMins: number;
            reputationStats: import("@prisma/client/runtime/library").JsonValue | null;
        } & {
            hours: import("@prisma/client").StoreHour[];
            storeZones: Array<{
                zone: {
                    id: string;
                    name: string;
                    slug: string;
                };
            }>;
            storeServiceAreas: Array<{
                serviceArea: {
                    id: string;
                    name: string;
                    slug: string;
                };
            }>;
            verificationDocuments: Array<{
                id: string;
                documentType: import("@prisma/client").StoreDocumentType;
                fileName: string;
                fileUrl: string;
                mimeType: string;
                uploadedAt: Date;
            }>;
            documentRequests: Array<{
                id: string;
                reason: string;
                documentTypes: unknown;
                requestedAt: Date;
                fulfilledAt: Date | null;
            }>;
            merchantProfile?: {
                id: string;
                isBlacklisted: boolean;
                blacklistReason: string | null;
                businessName: string;
            };
        };
    }>;
    uploadVerificationDocument(user: RequestUser, storeId: string, dto: UploadVerificationDocumentDto, ip: string): Promise<{
        success: boolean;
        data: {
            phone: string | null;
            email: string | null;
            id: string;
            status: import("@prisma/client").$Enums.StoreStatus;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            deliveryFee: import("@prisma/client/runtime/library").Decimal;
            minOrderAmount: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            ratingAvg: number;
            ratingCount: number;
            latitude: number;
            longitude: number;
            submittedAt: Date | null;
            rejectionReason: string | null;
            merchantProfileId: string;
            cityId: string;
            slug: string;
            logoUrl: string | null;
            bannerUrl: string | null;
            line1: string;
            line2: string | null;
            pincode: string;
            locality: string | null;
            locationPincodeId: string | null;
            locationAreaId: string | null;
            locationCityId: string | null;
            deliveryRadiusKm: number;
            storeType: import("@prisma/client").$Enums.StoreType;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            rejectionType: import("@prisma/client").$Enums.RejectionType | null;
            rejectionRevokedAt: Date | null;
            rejectionRevokedBy: string | null;
            rejectionRevokeReason: string | null;
            documentRequestReason: string | null;
            documentRequestAt: Date | null;
            documentRequestBy: string | null;
            requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
            avgPrepTimeMins: number;
            reputationStats: import("@prisma/client/runtime/library").JsonValue | null;
        } & {
            hours: import("@prisma/client").StoreHour[];
            storeZones: Array<{
                zone: {
                    id: string;
                    name: string;
                    slug: string;
                };
            }>;
            storeServiceAreas: Array<{
                serviceArea: {
                    id: string;
                    name: string;
                    slug: string;
                };
            }>;
            verificationDocuments: Array<{
                id: string;
                documentType: import("@prisma/client").StoreDocumentType;
                fileName: string;
                fileUrl: string;
                mimeType: string;
                uploadedAt: Date;
            }>;
            documentRequests: Array<{
                id: string;
                reason: string;
                documentTypes: unknown;
                requestedAt: Date;
                fulfilledAt: Date | null;
            }>;
            merchantProfile?: {
                id: string;
                isBlacklisted: boolean;
                blacklistReason: string | null;
                businessName: string;
            };
        };
    }>;
    submitDocumentsForReview(user: RequestUser, storeId: string, ip: string): Promise<{
        success: boolean;
        data: {
            phone: string | null;
            email: string | null;
            id: string;
            status: import("@prisma/client").$Enums.StoreStatus;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            deliveryFee: import("@prisma/client/runtime/library").Decimal;
            minOrderAmount: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            ratingAvg: number;
            ratingCount: number;
            latitude: number;
            longitude: number;
            submittedAt: Date | null;
            rejectionReason: string | null;
            merchantProfileId: string;
            cityId: string;
            slug: string;
            logoUrl: string | null;
            bannerUrl: string | null;
            line1: string;
            line2: string | null;
            pincode: string;
            locality: string | null;
            locationPincodeId: string | null;
            locationAreaId: string | null;
            locationCityId: string | null;
            deliveryRadiusKm: number;
            storeType: import("@prisma/client").$Enums.StoreType;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            rejectionType: import("@prisma/client").$Enums.RejectionType | null;
            rejectionRevokedAt: Date | null;
            rejectionRevokedBy: string | null;
            rejectionRevokeReason: string | null;
            documentRequestReason: string | null;
            documentRequestAt: Date | null;
            documentRequestBy: string | null;
            requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
            avgPrepTimeMins: number;
            reputationStats: import("@prisma/client/runtime/library").JsonValue | null;
        } & {
            hours: import("@prisma/client").StoreHour[];
            storeZones: Array<{
                zone: {
                    id: string;
                    name: string;
                    slug: string;
                };
            }>;
            storeServiceAreas: Array<{
                serviceArea: {
                    id: string;
                    name: string;
                    slug: string;
                };
            }>;
            verificationDocuments: Array<{
                id: string;
                documentType: import("@prisma/client").StoreDocumentType;
                fileName: string;
                fileUrl: string;
                mimeType: string;
                uploadedAt: Date;
            }>;
            documentRequests: Array<{
                id: string;
                reason: string;
                documentTypes: unknown;
                requestedAt: Date;
                fulfilledAt: Date | null;
            }>;
            merchantProfile?: {
                id: string;
                isBlacklisted: boolean;
                blacklistReason: string | null;
                businessName: string;
            };
        };
    }>;
}
