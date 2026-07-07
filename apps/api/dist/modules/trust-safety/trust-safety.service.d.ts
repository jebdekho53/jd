import { FraudCaseCategory, RiskProfileStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FraudActionService } from './fraud-action.service';
import { FraudCaseService } from './fraud-case.service';
import { RiskEngineService } from './risk-engine.service';
import { TrustAlertService } from './trust-alert.service';
export declare class TrustSafetyService {
    private readonly prisma;
    private readonly cases;
    private readonly actions;
    private readonly risk;
    private readonly alerts;
    constructor(prisma: PrismaService, cases: FraudCaseService, actions: FraudActionService, risk: RiskEngineService, alerts: TrustAlertService);
    getDashboard(): Promise<{
        metrics: {
            openCases: number;
            blockedUsers: number;
            blockedMerchants: number;
            activeRestrictions: number;
            fraudPrevented: number;
            walletAbusePrevented: number;
            referralAbusePrevented: number;
            codLossAvoided: number;
        };
        alerts: {
            message: string;
            id: string;
            status: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            severity: string;
            title: string;
            resolvedAt: Date | null;
            alertType: import("@prisma/client").$Enums.TrustAlertType;
        }[];
    }>;
    listRiskProfiles(page?: number, limit?: number, status?: RiskProfileStatus): Promise<{
        items: {
            id: string;
            status: import("@prisma/client").$Enums.RiskProfileStatus;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            riskScore: number;
            trustScore: number;
            fraudScore: number;
            codEnabled: boolean;
            walletFrozen: boolean;
            referralFrozen: boolean;
            couponFrozen: boolean;
            lastEvaluatedAt: Date | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    listCases(category?: FraudCaseCategory, page?: number, limit?: number): Promise<{
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
    listBlockedAccounts(page?: number, limit?: number): Promise<{
        items: {
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
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    adminAction(adminUserId: string, action: 'approve' | 'reject' | 'warn' | 'restrict' | 'suspend' | 'blacklist', userId: string, reason: string, caseId?: string): Promise<{
        success: boolean;
    }>;
    enableCodForBuyer(userId: string, adminUserId: string): Promise<{
        success: boolean;
    }>;
}
