import { FranchisePartnerStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class FranchiseService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    resolveFranchiseId(userId: string): Promise<string>;
    listFranchises(status?: FranchisePartnerStatus): Promise<({
        city: {
            name: string;
        } | null;
        _count: {
            stores: number;
            territories: number;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.FranchisePartnerStatus;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        businessName: string;
        cityId: string | null;
        commissionPercent: number;
        gstin: string | null;
        pan: string | null;
        onboardingCompleted: boolean;
    })[]>;
    createFranchise(input: {
        userId: string;
        businessName: string;
        gstin?: string;
        pan?: string;
        cityId?: string;
        commissionPercent?: number;
    }): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.FranchisePartnerStatus;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        businessName: string;
        cityId: string | null;
        commissionPercent: number;
        gstin: string | null;
        pan: string | null;
        onboardingCompleted: boolean;
    }>;
    updateFranchise(id: string, input: Partial<{
        status: FranchisePartnerStatus;
        commissionPercent: number;
        onboardingCompleted: boolean;
    }>, actorId?: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.FranchisePartnerStatus;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        businessName: string;
        cityId: string | null;
        commissionPercent: number;
        gstin: string | null;
        pan: string | null;
        onboardingCompleted: boolean;
    }>;
    linkStore(franchiseId: string, storeId: string): Promise<{
        store: {
            name: string;
            pincode: string;
        };
    } & {
        id: string;
        storeId: string;
        franchiseId: string;
        linkedAt: Date;
    }>;
    getOverview(): Promise<{
        active: number;
        pending: number;
        suspended: number;
        openConflicts: number;
    }>;
}
