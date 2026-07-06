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
            balancePaise: any;
            balanceRupee: number;
            minimumRechargePaise: number;
            minimumRechargeRupee: number;
            aiProductCostPaise: number;
            aiProductCostRupee: number;
            totalSpentPaise: any;
            totalRechargedPaise: any;
            totalRefundedPaise: any;
            transactions: any;
            meta: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
        };
    }>;
    createRechargeOrder(user: RequestUser, dto: CreateAiWalletRechargeDto, ip: string): Promise<{
        success: boolean;
        data: {
            transactionId: any;
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
            balancePaise: any;
            transactionId: any;
        };
    }>;
}
