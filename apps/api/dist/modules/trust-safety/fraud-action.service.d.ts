import { FraudDecisionAction } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FraudCaseService } from './fraud-case.service';
export declare class FraudActionService {
    private readonly prisma;
    private readonly cases;
    private readonly logger;
    constructor(prisma: PrismaService, cases: FraudCaseService);
    apply(userId: string, action: FraudDecisionAction, reason: string, adminUserId?: string, idempotencyKey?: string): Promise<any>;
    liftRestriction(restrictionId: string, adminUserId: string): Promise<any>;
    private addRestriction;
}
