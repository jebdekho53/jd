import { RequestUser } from '../../common/types';
import { MerchantService } from '../merchant/merchant.service';
import { MerchantAiWalletService } from './merchant-ai-wallet.service';
import { CreateAiWalletRechargeDto, VerifyAiWalletRechargeDto } from './dto/merchant-ai-wallet.dto';
export declare class MerchantAiWalletController {
    private readonly wallet;
    private readonly merchantService;
    constructor(wallet: MerchantAiWalletService, merchantService: MerchantService);
    getWallet(user: RequestUser, page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            balancePaise: number;
            balanceRupee: number;
            minimumRechargePaise: number;
            minimumRechargeRupee: number;
            aiProductCostPaise: number;
            aiProductCostRupee: number;
            totalSpentPaise: number;
            totalRechargedPaise: number;
            totalRefundedPaise: number;
            transactions: {
                id: string;
                type: import("@prisma/client").$Enums.MerchantAiWalletTransactionType;
                status: import("@prisma/client").$Enums.MerchantAiWalletTransactionStatus;
                amountPaise: number;
                amountRupee: number;
                balanceBeforePaise: number;
                balanceAfterPaise: number;
                reason: string | null;
                storeId: string | null;
                analysisId: string | null;
                productName: string | null;
                createdAt: Date;
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    createRechargeOrder(user: RequestUser, dto: CreateAiWalletRechargeDto, ip: string): Promise<{
        success: boolean;
        data: {
            transactionId: string;
            razorpayOrderId: string;
            keyId: string;
            amount: number;
            currency: string;
            amountPaise: number;
        };
    }>;
    verifyRecharge(user: RequestUser, dto: VerifyAiWalletRechargeDto, ip: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            alreadyProcessed: boolean;
            balancePaise: number;
            transactionId: string;
        };
    }>;
}
