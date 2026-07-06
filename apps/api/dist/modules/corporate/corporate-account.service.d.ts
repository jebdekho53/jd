import { PrismaService } from '../../database/prisma.service';
export declare class CorporateAccountService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAccountsForUser(userId: string): Promise<any>;
    createAccount(companyName: string, gstin?: string, creditLimit?: number): Promise<any>;
    addUser(accountId: string, userId: string, role: 'ADMIN' | 'APPROVER' | 'EMPLOYEE'): Promise<any>;
}
