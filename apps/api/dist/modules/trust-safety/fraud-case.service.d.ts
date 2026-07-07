import { FraudCaseCategory, FraudCaseStatus, FraudDecisionAction, Prisma } from '@prisma/client';
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
    }): Promise<{
        category: import("@prisma/client").$Enums.FraudCaseCategory;
        idempotencyKey: string | null;
        id: string;
        status: import("@prisma/client").$Enums.FraudCaseStatus;
        createdAt: Date;
        userId: string | null;
        updatedAt: Date;
        description: string;
        severity: string;
        subjectType: string | null;
        subjectId: string | null;
        caseNumber: string;
        title: string;
        resolvedAt: Date | null;
        resolvedBy: string | null;
        resolution: string | null;
    }>;
    recordDecision(input: {
        fraudCaseId?: string;
        fraudRuleId?: string;
        userId?: string;
        decision: FraudDecisionAction;
        idempotencyKey: string;
        metadata?: Record<string, unknown>;
        actionTaken?: boolean;
    }): Promise<{
        idempotencyKey: string;
        id: string;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        userId: string | null;
        fraudCaseId: string | null;
        fraudRuleId: string | null;
        decision: import("@prisma/client").$Enums.FraudDecisionAction;
        actionTaken: boolean;
    }>;
    listCases(category?: FraudCaseCategory, status?: FraudCaseStatus, page?: number, limit?: number): Promise<{
        items: {
            category: import("@prisma/client").$Enums.FraudCaseCategory;
            idempotencyKey: string | null;
            id: string;
            status: import("@prisma/client").$Enums.FraudCaseStatus;
            createdAt: Date;
            userId: string | null;
            updatedAt: Date;
            description: string;
            severity: string;
            subjectType: string | null;
            subjectId: string | null;
            caseNumber: string;
            title: string;
            resolvedAt: Date | null;
            resolvedBy: string | null;
            resolution: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    resolveCase(caseId: string, adminUserId: string, resolution: string, dismiss?: boolean): Promise<{
        category: import("@prisma/client").$Enums.FraudCaseCategory;
        idempotencyKey: string | null;
        id: string;
        status: import("@prisma/client").$Enums.FraudCaseStatus;
        createdAt: Date;
        userId: string | null;
        updatedAt: Date;
        description: string;
        severity: string;
        subjectType: string | null;
        subjectId: string | null;
        caseNumber: string;
        title: string;
        resolvedAt: Date | null;
        resolvedBy: string | null;
        resolution: string | null;
    }>;
}
