import { PrismaService } from '../../database/prisma.service';
import { FraudCaseService } from '../trust-safety/fraud-case.service';
export declare class AdFraudGuardService {
    private readonly prisma;
    private readonly fraudCases;
    constructor(prisma: PrismaService, fraudCases: FraudCaseService);
    checkClickFraud(userId: string | undefined, campaignId: string): Promise<boolean>;
    checkImpressionFraud(userId: string | undefined, campaignId: string): Promise<boolean>;
}
