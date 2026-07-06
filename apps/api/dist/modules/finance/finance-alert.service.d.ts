import { FinanceAlertSeverity, FinanceAlertType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class FinanceAlertService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    raiseSettlementFailure(merchantProfileId: string, reason: string): Promise<void>;
    raiseCodMismatch(riderProfileId: string, amount: number): Promise<void>;
    raiseRefundFailed(orderId: string, refundId: string, reason: string): Promise<void>;
    raiseFraudAlert(input: {
        alertType: FinanceAlertType;
        severity: FinanceAlertSeverity;
        title: string;
        message: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    checkNegativeMerchantBalances(): Promise<number>;
    checkCodMismatches(): Promise<number>;
    listOpen(limit?: number): Promise<any>;
    private create;
}
