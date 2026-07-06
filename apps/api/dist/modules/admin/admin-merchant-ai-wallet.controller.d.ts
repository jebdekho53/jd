import { RequestUser } from '../../common/types';
import { MerchantAiWalletService } from '../product/merchant-ai-wallet.service';
import { AdminAdjustAiWalletDto } from '../product/dto/merchant-ai-wallet.dto';
export declare class AdminMerchantAiWalletController {
    private readonly wallet;
    constructor(wallet: MerchantAiWalletService);
    list(page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            items: any;
            meta: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
        };
    }>;
    stats(): Promise<{
        success: boolean;
        data: {
            totalRechargesPaise: any;
            totalRechargeCount: any;
            totalAiSpendPaise: any;
            totalDebitCount: any;
            totalRefundsPaise: any;
            totalRefundCount: any;
            outstandingBalancePaise: any;
            merchantsWithBalance: any;
            topMerchantsBySpend: any;
        };
    }>;
    detail(merchantId: string): Promise<{
        success: boolean;
        data: {
            merchantProfileId: string;
            businessName: any;
            email: any;
            phone: any;
            balancePaise: any;
            totalRechargedPaise: any;
            totalSpentPaise: any;
            totalRefundedPaise: any;
            transactions: any;
        };
    }>;
    adjust(user: RequestUser, merchantId: string, dto: AdminAdjustAiWalletDto, ip: string): Promise<{
        success: boolean;
        data: {
            balancePaise: any;
            transactionId: any;
        };
    }>;
}
