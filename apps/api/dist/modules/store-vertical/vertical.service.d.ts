import { VerticalBusinessType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare class VerticalService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    listStoreBusinessTypes(storeId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.StoreBusinessTypeStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        rejectionReason: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        businessType: import("@prisma/client").$Enums.VerticalBusinessType;
        isPrimary: boolean;
    }[]>;
    setStoreBusinessTypes(storeId: string, types: VerticalBusinessType[], primary?: VerticalBusinessType): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.StoreBusinessTypeStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        rejectionReason: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        businessType: import("@prisma/client").$Enums.VerticalBusinessType;
        isPrimary: boolean;
    }[]>;
    approveStoreBusinessType(storeId: string, businessType: VerticalBusinessType, adminId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.StoreBusinessTypeStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        rejectionReason: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        businessType: import("@prisma/client").$Enums.VerticalBusinessType;
        isPrimary: boolean;
    }>;
    rejectStoreBusinessType(storeId: string, businessType: VerticalBusinessType, adminId: string, reason: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.StoreBusinessTypeStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        rejectionReason: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        businessType: import("@prisma/client").$Enums.VerticalBusinessType;
        isPrimary: boolean;
    }>;
    syncApplicationBusinessTypes(applicationId: string, types: VerticalBusinessType[]): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.StoreBusinessTypeStatus;
        createdAt: Date;
        updatedAt: Date;
        rejectionReason: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        businessType: import("@prisma/client").$Enums.VerticalBusinessType;
        applicationId: string;
    }[]>;
    copyApprovedTypesToStore(storeId: string, applicationId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.StoreBusinessTypeStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        rejectionReason: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        businessType: import("@prisma/client").$Enums.VerticalBusinessType;
        isPrimary: boolean;
    }[]>;
    ensureStoreBusinessTypesFromApplication(storeId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.StoreBusinessTypeStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        rejectionReason: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        businessType: import("@prisma/client").$Enums.VerticalBusinessType;
        isPrimary: boolean;
    }[]>;
    findStoresByVertical(businessType: VerticalBusinessType, opts?: {
        lat?: number;
        lng?: number;
        limit?: number;
        page?: number;
    }): Promise<({
        restaurantProfile: ({
            cuisines: ({
                cuisine: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    isActive: boolean;
                    slug: string;
                    sortOrder: number;
                    imageUrl: string | null;
                };
            } & {
                id: string;
                storeId: string;
                cuisineId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            packagingFee: import("@prisma/client/runtime/library").Decimal;
            minOrderAmount: import("@prisma/client/runtime/library").Decimal;
            acceptanceRate: number;
            avgPrepTimeMins: number;
            acceptsScheduled: boolean;
            isCloudKitchen: boolean;
            costForTwo: import("@prisma/client/runtime/library").Decimal | null;
        }) | null;
        businessTypes: {
            id: string;
            status: import("@prisma/client").$Enums.StoreBusinessTypeStatus;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            rejectionReason: string | null;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            businessType: import("@prisma/client").$Enums.VerticalBusinessType;
            isPrimary: boolean;
        }[];
    } & {
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
    })[]>;
}
