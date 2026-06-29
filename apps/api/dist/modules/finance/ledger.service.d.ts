import { OnModuleInit } from '@nestjs/common';
import { LedgerReferenceType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export interface LedgerLine {
    accountCode: string;
    debit: number;
    credit: number;
}
export declare class LedgerService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    private accountCache;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    refreshAccountCache(): Promise<void>;
    postJournal(input: {
        referenceType: LedgerReferenceType;
        referenceId: string;
        orderId?: string;
        description: string;
        idempotencyKey: string;
        lines: LedgerLine[];
        metadata?: Record<string, unknown>;
    }): Promise<string>;
    recordOrderPayment(orderId: string, amount: number, isCod: boolean): Promise<void>;
    recordMerchantSettlement(orderId: string, merchantProfileId: string, gross: number, commission: number, net: number): Promise<void>;
    recordMerchantPayout(payoutId: string, merchantProfileId: string, amount: number): Promise<void>;
    recordRefund(orderId: string, amount: number): Promise<void>;
    recordClaimRefund(claimId: string, orderId: string, amount: number): Promise<void>;
    recordWalletCredit(walletTxnId: string, amount: number): Promise<void>;
    recordRiderPayout(payoutId: string, riderProfileId: string, amount: number): Promise<void>;
    recordTaxAccrual(orderId: string, taxAmount: number, taxableAmount: number): Promise<void>;
    getAccountBalances(): Promise<Array<{
        code: string;
        name: string;
        debit: number;
        credit: number;
        balance: number;
    }>>;
    private ensureAccounts;
}
