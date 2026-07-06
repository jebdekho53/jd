import { AIProductAnalysisStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MerchantAiWalletService } from '../product/merchant-ai-wallet.service';
export interface AdminAiUsageFilters {
    status?: AIProductAnalysisStatus;
    merchantProfileId?: string;
    storeId?: string;
    lowConfidence?: boolean;
    charged?: boolean;
    failed?: boolean;
    page?: number;
    limit?: number;
}
export declare class AdminAiProductUsageService {
    private readonly prisma;
    private readonly aiWallet;
    constructor(prisma: PrismaService, aiWallet: MerchantAiWalletService);
    private buildWhere;
    getStats(filters?: AdminAiUsageFilters): Promise<{
        totalAnalyses: any;
        confirmedProducts: any;
        failedAnalyses: any;
        refunds: any;
        totalAiRevenuePaise: number;
        totalAiRevenueRupee: number;
        grossAiRevenuePaise: any;
        refundedAiRevenuePaise: any;
        successfulCharges: any;
        merchantWise: any;
        wallet: {
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
    list(filters: AdminAiUsageFilters): Promise<{
        stats: any;
        items: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    exportCsv(filters?: AdminAiUsageFilters): Promise<string>;
    getDetail(analysisId: string): Promise<{
        id: any;
        merchant: any;
        store: any;
        uploadedImageUrl: any;
        extractedJson: any;
        confidence: any;
        status: any;
        chargeAmountPaise: any;
        chargedAt: any;
        createdProduct: any;
        errorMessage: any;
        transactions: any;
        createdAt: any;
        updatedAt: any;
    }>;
}
