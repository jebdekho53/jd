import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from '../finance/ledger.service';
export declare class FranchiseSettlementService {
    private readonly prisma;
    private readonly ledger;
    constructor(prisma: PrismaService, ledger: LedgerService);
    createSettlement(franchiseId: string, periodStart: Date, periodEnd: Date): Promise<any>;
    listSettlements(franchiseId: string): Promise<any>;
    listAllSettlements(): Promise<any>;
}
