import { FraudCaseCategory } from '@prisma/client';
import { RequestUser } from '../../common/types';
import { TrustSafetyService } from './trust-safety.service';
import { TrustAlertService } from './trust-alert.service';
import { FraudCaseService } from './fraud-case.service';
import { AdminTrustActionDto, EnableCodDto, ListTrustQueryDto } from './dto/trust-safety.dto';
export declare class AdminTrustSafetyController {
    private readonly trust;
    private readonly alerts;
    private readonly cases;
    constructor(trust: TrustSafetyService, alerts: TrustAlertService, cases: FraudCaseService);
    overview(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    listAlerts(): Promise<{
        success: boolean;
        data: {
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
    fraudCases(query: ListTrustQueryDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    fraudCasesByCategory(category: FraudCaseCategory, query: ListTrustQueryDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    riskProfiles(query: ListTrustQueryDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    blocked(query: ListTrustQueryDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    action(user: RequestUser, dto: AdminTrustActionDto): Promise<{
        success: boolean;
        data: {
            success: boolean;
        };
    }>;
    resolveCase(user: RequestUser, id: string, resolution: string, dismiss?: boolean): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    enableCod(user: RequestUser, dto: EnableCodDto): Promise<{
        success: boolean;
        data: {
            success: boolean;
        };
    }>;
    resolveAlert(id: string): Promise<{
        success: boolean;
        data: {
            message: string;
            id: string;
            status: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            severity: string;
            title: string;
            resolvedAt: Date | null;
            alertType: import("@prisma/client").$Enums.TrustAlertType;
        };
    }>;
}
