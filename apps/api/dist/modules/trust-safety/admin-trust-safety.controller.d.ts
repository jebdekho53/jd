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
        };
    }>;
    listAlerts(): Promise<{
        success: boolean;
        data: any;
    }>;
    fraudCases(query: ListTrustQueryDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    fraudCasesByCategory(category: FraudCaseCategory, query: ListTrustQueryDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    riskProfiles(query: ListTrustQueryDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    blocked(query: ListTrustQueryDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
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
        data: any;
    }>;
    enableCod(user: RequestUser, dto: EnableCodDto): Promise<{
        success: boolean;
        data: {
            success: boolean;
        };
    }>;
    resolveAlert(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
}
