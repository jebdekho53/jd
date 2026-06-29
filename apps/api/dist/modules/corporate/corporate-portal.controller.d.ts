import { RequestUser } from '../../common/types';
import { CorporateAccountService } from './corporate-account.service';
import { ApprovalService } from './approval.service';
import { CorporateBillingService } from './corporate-billing.service';
import { CorporateWalletService } from './corporate-wallet.service';
import { PrismaService } from '../../database/prisma.service';
export declare class CorporatePortalController {
    private readonly accounts;
    private readonly approval;
    private readonly billing;
    private readonly wallet;
    private readonly prisma;
    constructor(accounts: CorporateAccountService, approval: ApprovalService, billing: CorporateBillingService, wallet: CorporateWalletService, prisma: PrismaService);
    listAccounts(user: RequestUser): Promise<{
        success: boolean;
        data: {
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
        }[];
    }>;
    createRequest(user: RequestUser, body: {
        amount: number;
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.PurchaseRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            orderId: string | null;
            notes: string | null;
            employeeId: string;
        };
        message?: undefined;
    }>;
    invoices(user: RequestUser): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            invoiceNumber: string;
            accountId: string;
            periodStart: Date | null;
            periodEnd: Date | null;
            invoiceAmount: import("@prisma/client/runtime/library").Decimal;
            ledgerJournalId: string | null;
        }[];
    }>;
    walletBalance(user: RequestUser): Promise<{
        success: boolean;
        data: {
            balance: number;
        };
    }>;
}
