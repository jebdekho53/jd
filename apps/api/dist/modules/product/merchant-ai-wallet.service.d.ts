import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RazorpayService } from '../payment/razorpay.service';
export declare const INSUFFICIENT_AI_WALLET_MESSAGE = "Insufficient AI wallet balance. Please recharge minimum \u20B9100 to continue.";
export declare class MerchantAiWalletService {
    private readonly prisma;
    private readonly config;
    private readonly razorpay;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, config: ConfigService, razorpay: RazorpayService, audit: AuditService);
    getMinRechargePaise(): number;
    getProductCostPaise(): number;
    getImageGenerationCostPaise(): number;
    buildDebitIdempotencyKey(merchantProfileId: string, storeId: string, analysisId: string): string;
    buildRefundIdempotencyKey(debitKey: string): string;
    getOrCreateWallet(merchantProfileId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        merchantProfileId: string;
        balancePaise: number;
        totalRechargedPaise: number;
        totalSpentPaise: number;
        totalRefundedPaise: number;
    }>;
    getWalletSummary(merchantProfileId: string, page?: number, limit?: number): Promise<{
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
    }>;
    createRechargeOrder(merchantProfileId: string, amountPaise: number, userId: string, ip?: string): Promise<{
        transactionId: string;
        razorpayOrderId: string;
        keyId: string;
        amount: number;
        currency: string;
        amountPaise: number;
    }>;
    verifyRecharge(merchantProfileId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string, userId: string, ip?: string): Promise<{
        success: boolean;
        alreadyProcessed: boolean;
        balancePaise: number;
        transactionId: string;
    }>;
    debitForProductCreation(merchantProfileId: string, storeId: string, analysisId: string, userId: string, ip?: string): Promise<{
        charged: boolean;
        amountPaise: number;
        transactionId: string;
    }>;
    debitForImageGeneration(merchantProfileId: string, storeId: string, analysisId: string, idempotencyToken: string, userId: string, ip?: string): Promise<{
        charged: boolean;
        amountPaise: number;
        transactionId: string;
        balancePaise: number;
    }>;
    refundOnProductCreationFailure(merchantProfileId: string, storeId: string, analysisId: string, reason: string, userId?: string, ip?: string): Promise<void>;
    adminAdjust(merchantProfileId: string, amountPaise: number, reason: string, adminUserId: string, ip?: string): Promise<{
        balancePaise: number;
        transactionId: string;
    }>;
    listWalletsForAdmin(page?: number, limit?: number): Promise<{
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
    }>;
    getWalletForAdmin(merchantProfileId: string): Promise<{
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
    }>;
    getWalletStatsForAdmin(): Promise<{
        totalRechargesPaise: number;
        totalRechargeCount: number;
        totalAiSpendPaise: number;
        totalDebitCount: number;
        totalRefundsPaise: number;
        totalRefundCount: number;
        outstandingBalancePaise: number;
        merchantsWithBalance: number;
        topMerchantsBySpend: (Prisma.PickEnumerable<Prisma.MerchantAiWalletTransactionGroupByOutputType, "merchantProfileId"[]> & {
            _count: number;
            _sum: {
                amountPaise: number | null;
            };
        })[];
    }>;
}
