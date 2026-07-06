import { ConfigService } from '@nestjs/config';
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
    buildDebitIdempotencyKey(merchantProfileId: string, storeId: string, analysisId: string): string;
    buildRefundIdempotencyKey(debitKey: string): string;
    getOrCreateWallet(merchantProfileId: string): Promise<any>;
    getWalletSummary(merchantProfileId: string, page?: number, limit?: number): Promise<{
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
    }>;
    createRechargeOrder(merchantProfileId: string, amountPaise: number, userId: string, ip?: string): Promise<{
        transactionId: any;
        razorpayOrderId: string;
        keyId: string;
        amount: number;
        currency: string;
        amountPaise: number;
    }>;
    verifyRecharge(merchantProfileId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string, userId: string, ip?: string): Promise<{
        success: boolean;
        alreadyProcessed: boolean;
        balancePaise: any;
        transactionId: any;
    }>;
    debitForProductCreation(merchantProfileId: string, storeId: string, analysisId: string, userId: string, ip?: string): Promise<{
        charged: boolean;
        amountPaise: number;
        transactionId: string;
    }>;
    refundOnProductCreationFailure(merchantProfileId: string, storeId: string, analysisId: string, reason: string, userId?: string, ip?: string): Promise<void>;
    adminAdjust(merchantProfileId: string, amountPaise: number, reason: string, adminUserId: string, ip?: string): Promise<{
        balancePaise: any;
        transactionId: any;
    }>;
    listWalletsForAdmin(page?: number, limit?: number): Promise<{
        items: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getWalletForAdmin(merchantProfileId: string): Promise<{
        merchantProfileId: string;
        businessName: any;
        email: any;
        phone: any;
        balancePaise: any;
        totalRechargedPaise: any;
        totalSpentPaise: any;
        totalRefundedPaise: any;
        transactions: any;
    }>;
    getWalletStatsForAdmin(): Promise<{
        totalRechargesPaise: any;
        totalRechargeCount: any;
        totalAiSpendPaise: any;
        totalDebitCount: any;
        totalRefundsPaise: any;
        totalRefundCount: any;
        outstandingBalancePaise: any;
        merchantsWithBalance: any;
        topMerchantsBySpend: any;
    }>;
}
