import { FranchisePartnerStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class FranchiseService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    resolveFranchiseId(userId: string): Promise<string>;
    listFranchises(status?: FranchisePartnerStatus): Promise<any>;
    createFranchise(input: {
        userId: string;
        businessName: string;
        gstin?: string;
        pan?: string;
        cityId?: string;
        commissionPercent?: number;
    }): Promise<any>;
    updateFranchise(id: string, input: Partial<{
        status: FranchisePartnerStatus;
        commissionPercent: number;
        onboardingCompleted: boolean;
    }>, actorId?: string): Promise<any>;
    linkStore(franchiseId: string, storeId: string): Promise<any>;
    getOverview(): Promise<{
        active: any;
        pending: any;
        suspended: any;
        openConflicts: any;
    }>;
}
