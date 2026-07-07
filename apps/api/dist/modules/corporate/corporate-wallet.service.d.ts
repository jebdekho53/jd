import { PrismaService } from '../../database/prisma.service';
export declare class CorporateWalletService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getBalance(accountId: string): Promise<number>;
    debit(accountId: string, amount: number): Promise<{
        id: string;
        updatedAt: Date;
        balance: import("@prisma/client/runtime/library").Decimal;
        accountId: string;
    }>;
    credit(accountId: string, amount: number): Promise<{
        id: string;
        updatedAt: Date;
        balance: import("@prisma/client/runtime/library").Decimal;
        accountId: string;
    }>;
}
