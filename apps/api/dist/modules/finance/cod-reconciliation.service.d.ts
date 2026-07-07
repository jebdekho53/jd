import { CodReconciliationStatus, DeliveryProviderType, Prisma } from '@prisma/client';
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
        submitted: number;
        expected: number;
        deposited: number;
        mismatch: number;
    }>;
    verify(adminUserId: string, id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.CodReconciliationStatus;
        createdAt: Date;
        updatedAt: Date;
        orderId: string | null;
        riderProfileId: string | null;
        providerType: import("@prisma/client").$Enums.DeliveryProviderType | null;
        amountExpected: Prisma.Decimal;
        amountCollected: Prisma.Decimal;
        amountDeposited: Prisma.Decimal;
        mismatchAmount: Prisma.Decimal;
        submittedAt: Date | null;
        verifiedAt: Date | null;
        verifiedBy: string | null;
        rejectionReason: string | null;
        notes: string | null;
    }>;
    reject(adminUserId: string, id: string, reason: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.CodReconciliationStatus;
        createdAt: Date;
        updatedAt: Date;
        orderId: string | null;
        riderProfileId: string | null;
        providerType: import("@prisma/client").$Enums.DeliveryProviderType | null;
        amountExpected: Prisma.Decimal;
        amountCollected: Prisma.Decimal;
        amountDeposited: Prisma.Decimal;
        mismatchAmount: Prisma.Decimal;
        submittedAt: Date | null;
        verifiedAt: Date | null;
        verifiedBy: string | null;
        rejectionReason: string | null;
        notes: string | null;
    }>;
    listAdmin(status?: CodReconciliationStatus, page?: number, limit?: number): Promise<{
        records: {
            id: string;
            rider: string;
            orderNumber: string | null;
            amountExpected: number;
            amountCollected: number;
            amountDeposited: number;
            mismatchAmount: number;
            status: import("@prisma/client").$Enums.CodReconciliationStatus;
            submittedAt: string | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    getSummary(): Promise<{
        codPending: number;
        codPendingCount: number;
        codSubmitted: number;
        codSubmittedCount: number;
        codDeposited: number;
        codVerifiedCount: number;
        mismatchCount: number;
    }>;
}
