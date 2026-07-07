import { PrismaService } from '../../database/prisma.service';
export declare class CorporateAccountService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAccountsForUser(userId: string): Promise<{
        role: import("@prisma/client").$Enums.CorporateUserRole;
        corporateUserId: string;
        wallet: {
            id: string;
            updatedAt: Date;
            balance: import("@prisma/client/runtime/library").Decimal;
            accountId: string;
        } | null;
        costCenters: {
            id: string;
            name: string;
            createdAt: Date;
            accountId: string;
            monthlyLimit: import("@prisma/client/runtime/library").Decimal;
        }[];
        id: string;
        status: import("@prisma/client").$Enums.CorporateAccountStatus;
        createdAt: Date;
        updatedAt: Date;
        gstin: string | null;
        companyName: string;
        creditLimit: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    createAccount(companyName: string, gstin?: string, creditLimit?: number): Promise<{
        wallet: {
            id: string;
            updatedAt: Date;
            balance: import("@prisma/client/runtime/library").Decimal;
            accountId: string;
        } | null;
    } & {
        id: string;
        status: import("@prisma/client").$Enums.CorporateAccountStatus;
        createdAt: Date;
        updatedAt: Date;
        gstin: string | null;
        companyName: string;
        creditLimit: import("@prisma/client/runtime/library").Decimal;
    }>;
    addUser(accountId: string, userId: string, role: 'ADMIN' | 'APPROVER' | 'EMPLOYEE'): Promise<{
        role: import("@prisma/client").$Enums.CorporateUserRole;
        id: string;
        createdAt: Date;
        userId: string;
        accountId: string;
    }>;
}
