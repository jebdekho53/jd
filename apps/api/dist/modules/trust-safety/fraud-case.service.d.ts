import { FraudCaseCategory, FraudCaseStatus, FraudDecisionAction } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class FraudCaseService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    openCase(input: {
        userId?: string;
        category: FraudCaseCategory;
        severity: string;
        title: string;
        description: string;
        subjectType?: string;
        subjectId?: string;
        idempotencyKey: string;
    }): Promise<any>;
    recordDecision(input: {
        fraudCaseId?: string;
        fraudRuleId?: string;
        userId?: string;
        decision: FraudDecisionAction;
        idempotencyKey: string;
        metadata?: Record<string, unknown>;
        actionTaken?: boolean;
    }): Promise<any>;
    listCases(category?: FraudCaseCategory, status?: FraudCaseStatus, page?: number, limit?: number): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    resolveCase(caseId: string, adminUserId: string, resolution: string, dismiss?: boolean): Promise<any>;
}
