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
            openCases: any;
            blockedUsers: any;
            blockedMerchants: any;
            activeRestrictions: any;
            fraudPrevented: any;
            walletAbusePrevented: any;
            referralAbusePrevented: any;
            codLossAvoided: any;
        };
        alerts: any;
    }>;
    listRiskProfiles(page?: number, limit?: number, status?: RiskProfileStatus): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    listCases(category?: FraudCaseCategory, page?: number, limit?: number): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    listBlockedAccounts(page?: number, limit?: number): Promise<{
        items: any;
        total: any;
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
