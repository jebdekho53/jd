import { RequestUser } from '../../common/types';
import { MerchantAiWalletService } from '../product/merchant-ai-wallet.service';
import { AdminAdjustAiWalletDto } from '../product/dto/merchant-ai-wallet.dto';
export declare class AdminMerchantAiWalletController {
    private readonly wallet;
    constructor(wallet: MerchantAiWalletService);
    list(page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            items: {
                merchantProfileId: string;
                businessName: string;
                email: string | null;
                phone: string;
                balancePaise: number;
                totalRechargedPaise: number;
                totalSpentPaise: number;
                totalRefundedPaise: number;
                updatedAt: Date;
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    stats(): Promise<{
        success: boolean;
        data: {
            totalRechargesPaise: number;
            totalRechargeCount: number;
            totalAiSpendPaise: number;
            totalDebitCount: number;
            totalRefundsPaise: number;
            totalRefundCount: number;
            outstandingBalancePaise: number;
            merchantsWithBalance: number;
            topMerchantsBySpend: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.MerchantAiWalletTransactionGroupByOutputType, "merchantProfileId"[]> & {
                _count: number;
                _sum: {
                    amountPaise: number | null;
                };
            })[];
        };
    }>;
    detail(merchantId: string): Promise<{
        success: boolean;
        data: {
            merchantProfileId: string;
            businessName: string | undefined;
            email: string | null | undefined;
            phone: string | undefined;
            balancePaise: number;
            totalRechargedPaise: number;
            totalSpentPaise: number;
            totalRefundedPaise: number;
            transactions: {
                idempotencyKey: string;
                type: import("@prisma/client").$Enums.MerchantAiWalletTransactionType;
                id: string;
                status: import("@prisma/client").$Enums.MerchantAiWalletTransactionStatus;
                createdAt: Date;
                reason: string | null;
                storeId: string | null;
                merchantProfileId: string;
                analysisId: string | null;
                razorpayOrderId: string | null;
                razorpayPaymentId: string | null;
                amountPaise: number;
                balanceBeforePaise: number;
                balanceAfterPaise: number;
            }[];
        };
    }>;
    adjust(user: RequestUser, merchantId: string, dto: AdminAdjustAiWalletDto, ip: string): Promise<{
        success: boolean;
        data: {
            balancePaise: number;
            transactionId: string;
        };
    }>;
}
