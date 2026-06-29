import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export interface RiskAssessment {
    riskScore: number;
    riskFlags: string[];
}
export declare class MerchantApplicationRiskService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    assess(input: {
        userId: string;
        ownerPhone?: string | null;
        ownerEmail?: string | null;
        gstNumber?: string | null;
        panNumber?: string | null;
        accountNumber?: string | null;
        applicationId?: string;
    }): Promise<RiskAssessment>;
    flagsToJson(flags: string[]): Prisma.InputJsonValue;
}
