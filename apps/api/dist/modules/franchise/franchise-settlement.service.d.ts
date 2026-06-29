import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from '../finance/ledger.service';
export declare class FranchiseSettlementService {
    private readonly prisma;
    private readonly ledger;
    constructor(prisma: PrismaService, ledger: LedgerService);
    createSettlement(franchiseId: string, periodStart: Date, periodEnd: Date): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.FranchiseSettlementStatus;
        createdAt: Date;
        paidAt: Date | null;
        franchiseId: string;
        periodStart: Date;
        periodEnd: Date;
        ledgerJournalId: string | null;
        grossGmv: import("@prisma/client/runtime/library").Decimal;
        franchiseShare: import("@prisma/client/runtime/library").Decimal;
        platformShare: import("@prisma/client/runtime/library").Decimal;
    }>;
    listSettlements(franchiseId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.FranchiseSettlementStatus;
        createdAt: Date;
        paidAt: Date | null;
        franchiseId: string;
        periodStart: Date;
        periodEnd: Date;
        ledgerJournalId: string | null;
        grossGmv: import("@prisma/client/runtime/library").Decimal;
        franchiseShare: import("@prisma/client/runtime/library").Decimal;
        platformShare: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    listAllSettlements(): Promise<({
        franchise: {
            businessName: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.FranchiseSettlementStatus;
        createdAt: Date;
        paidAt: Date | null;
        franchiseId: string;
        periodStart: Date;
        periodEnd: Date;
        ledgerJournalId: string | null;
        grossGmv: import("@prisma/client/runtime/library").Decimal;
        franchiseShare: import("@prisma/client/runtime/library").Decimal;
        platformShare: import("@prisma/client/runtime/library").Decimal;
    })[]>;
}
