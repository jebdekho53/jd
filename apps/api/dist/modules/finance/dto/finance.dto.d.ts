import { CodReconciliationStatus, SettlementCycle } from '@prisma/client';
export declare class ListFinanceQueryDto {
    page?: number;
    limit?: number;
    status?: CodReconciliationStatus;
}
export declare class CodSubmitDto {
    orderIds: string[];
    amountDeposited: number;
    notes?: string;
}
export declare class RejectCodDto {
    reason: string;
}
export declare class GenerateSettlementDto {
    cycle: SettlementCycle;
    merchantProfileId?: string;
}
export declare class MarkRiderPayoutPaidDto {
    referenceId: string;
}
export declare class ExportQueryDto {
    periodMonth?: string;
    merchantProfileId?: string;
}
