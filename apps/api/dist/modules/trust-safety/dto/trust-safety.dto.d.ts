import { FraudCaseCategory, RiskProfileStatus } from '@prisma/client';
export declare class ListTrustQueryDto {
    page?: number;
    limit?: number;
    category?: FraudCaseCategory;
    status?: RiskProfileStatus;
}
export declare class AdminTrustActionDto {
    userId: string;
    action: 'approve' | 'reject' | 'warn' | 'restrict' | 'suspend' | 'blacklist';
    reason: string;
    caseId?: string;
}
export declare class EnableCodDto {
    userId: string;
}
