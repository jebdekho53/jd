import { PrismaService } from '../../database/prisma.service';
export declare class CorporateWalletService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getBalance(accountId: string): Promise<number>;
    debit(accountId: string, amount: number): Promise<any>;
    credit(accountId: string, amount: number): Promise<any>;
}
