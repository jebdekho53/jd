import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from '../finance/ledger.service';
export declare class CorporateBillingService {
    private readonly prisma;
    private readonly ledger;
    constructor(prisma: PrismaService, ledger: LedgerService);
    generateMonthlyInvoice(accountId: string, periodStart: Date, periodEnd: Date): Promise<any>;
    listInvoices(accountId: string): Promise<any>;
}
