import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from '../finance/ledger.service';
export declare class CorporateBillingService {
    private readonly prisma;
    private readonly ledger;
    constructor(prisma: PrismaService, ledger: LedgerService);
    generateMonthlyInvoice(accountId: string, periodStart: Date, periodEnd: Date): Promise<{
        id: string;
        createdAt: Date;
        invoiceNumber: string;
        accountId: string;
        periodStart: Date | null;
        periodEnd: Date | null;
        invoiceAmount: import("@prisma/client/runtime/library").Decimal;
        ledgerJournalId: string | null;
    } | null>;
    listInvoices(accountId: string): Promise<{
        id: string;
        createdAt: Date;
        invoiceNumber: string;
        accountId: string;
        periodStart: Date | null;
        periodEnd: Date | null;
        invoiceAmount: import("@prisma/client/runtime/library").Decimal;
        ledgerJournalId: string | null;
    }[]>;
}
