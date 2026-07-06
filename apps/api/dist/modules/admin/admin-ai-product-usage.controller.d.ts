import { AIProductAnalysisStatus } from '@prisma/client';
import { AdminAiProductUsageService } from './admin-ai-product-usage.service';
export declare class AdminAiProductUsageController {
    private readonly usage;
    constructor(usage: AdminAiProductUsageService);
    stats(merchantProfileId?: string, storeId?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    exportCsv(status?: AIProductAnalysisStatus, merchantProfileId?: string, storeId?: string, lowConfidence?: string, charged?: string, failed?: string): Promise<string>;
    list(status?: AIProductAnalysisStatus, merchantProfileId?: string, storeId?: string, lowConfidence?: string, charged?: string, failed?: string, page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            stats: any;
            items: any;
            meta: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
        };
    }>;
    detail(analysisId: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
