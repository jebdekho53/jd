import { FraudDecisionAction } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FraudCaseService } from './fraud-case.service';
export declare class FraudActionService {
    private readonly prisma;
    private readonly cases;
    private readonly logger;
    constructor(prisma: PrismaService, cases: FraudCaseService);
    apply(userId: string, action: FraudDecisionAction, reason: string, adminUserId?: string, idempotencyKey?: string): Promise<{
        idempotencyKey: string;
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        userId: string | null;
        fraudCaseId: string | null;
        fraudRuleId: string | null;
        decision: import("@prisma/client").$Enums.FraudDecisionAction;
        actionTaken: boolean;
    } | {
        success: boolean;
        action: import("@prisma/client").$Enums.FraudDecisionAction;
    }>;
    liftRestriction(restrictionId: string, adminUserId: string): Promise<{
        id: string;
        createdAt: Date;
        expiresAt: Date | null;
        userId: string;
        reason: string;
        active: boolean;
        restrictionType: import("@prisma/client").$Enums.AccountRestrictionType;
        appliedBy: string | null;
        liftedAt: Date | null;
        liftedBy: string | null;
    }>;
    private addRestriction;
}
