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
        data: any;
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
        data: any;
        message?: undefined;
    }>;
    invoices(user: RequestUser): Promise<{
        success: boolean;
        data: any;
    }>;
    walletBalance(user: RequestUser): Promise<{
        success: boolean;
        data: {
            balance: number;
        };
    }>;
}
