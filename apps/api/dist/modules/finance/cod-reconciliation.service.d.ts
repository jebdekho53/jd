import { CodReconciliationStatus, DeliveryProviderType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from './ledger.service';
import { FinanceAlertService } from './finance-alert.service';
export declare class CodReconciliationService {
    private readonly prisma;
    private readonly ledger;
    private readonly alerts;
    constructor(prisma: PrismaService, ledger: LedgerService, alerts: FinanceAlertService);
    createForDeliveredOrder(orderId: string, riderProfileId: string | null, providerType?: DeliveryProviderType | null): Promise<void>;
    submitRemittance(riderProfileId: string, input: {
        orderIds: string[];
        amountDeposited: number;
        notes?: string;
    }): Promise<{
        submitted: any;
        expected: number;
        deposited: number;
        mismatch: number;
    }>;
    verify(adminUserId: string, id: string): Promise<any>;
    reject(adminUserId: string, id: string, reason: string): Promise<any>;
    listAdmin(status?: CodReconciliationStatus, page?: number, limit?: number): Promise<{
        records: any;
        meta: {
            page: number;
            limit: number;
            total: any;
        };
    }>;
    getSummary(): Promise<{
        codPending: number;
        codPendingCount: any;
        codSubmitted: number;
        codSubmittedCount: any;
        codDeposited: number;
        codVerifiedCount: any;
        mismatchCount: any;
    }>;
}
