import { AIProductAnalysisStatus } from '@prisma/client';
import { AdminAiProductUsageService } from './admin-ai-product-usage.service';
export declare class AdminAiProductUsageController {
    private readonly usage;
    constructor(usage: AdminAiProductUsageService);
    stats(merchantProfileId?: string, storeId?: string): Promise<{
        success: boolean;
        data: {
            totalAnalyses: number;
            confirmedProducts: number;
            failedAnalyses: number;
            refunds: number;
            totalAiRevenuePaise: number;
            totalAiRevenueRupee: number;
            grossAiRevenuePaise: number;
            refundedAiRevenuePaise: number;
            successfulCharges: number;
            merchantWise: {
                merchantProfileId: string;
                businessName: string;
                analysisCount: number;
            }[];
            wallet: {
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
        };
    }>;
    exportCsv(status?: AIProductAnalysisStatus, merchantProfileId?: string, storeId?: string, lowConfidence?: string, charged?: string, failed?: string): Promise<string>;
    list(status?: AIProductAnalysisStatus, merchantProfileId?: string, storeId?: string, lowConfidence?: string, charged?: string, failed?: string, page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            stats: {
                totalAnalyses: number;
                confirmedProducts: number;
                failedAnalyses: number;
                refunds: number;
                totalAiRevenuePaise: number;
                totalAiRevenueRupee: number;
                grossAiRevenuePaise: number;
                refundedAiRevenuePaise: number;
                successfulCharges: number;
                merchantWise: {
                    merchantProfileId: string;
                    businessName: string;
                    analysisCount: number;
                }[];
                wallet: {
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
            };
            items: {
                id: string;
                merchant: {
                    id: string;
                    businessName: string;
                    phone: string;
                    email: string | null;
                };
                store: {
                    id: string;
                    name: string;
                };
                uploadedImageUrl: string;
                confidence: number | null;
                status: import("@prisma/client").$Enums.AIProductAnalysisStatus;
                chargeAmountPaise: number;
                chargedAt: Date | null;
                createdProduct: {
                    id: string;
                    name: string;
                    slug: string;
                } | null;
                errorMessage: string | null;
                createdAt: Date;
                debitTransaction: {
                    id: string;
                    status: import("@prisma/client").$Enums.MerchantAiCreditTransactionStatus;
                    createdAt: Date;
                    amountPaise: number;
                };
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    detail(analysisId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            merchant: {
                user: {
                    phone: string;
                    email: string | null;
                };
                id: string;
                businessName: string;
            };
            store: {
                id: string;
                name: string;
            };
            uploadedImageUrl: string;
            extractedJson: import("@prisma/client/runtime/library").JsonValue;
            confidence: number | null;
            status: import("@prisma/client").$Enums.AIProductAnalysisStatus;
            chargeAmountPaise: number;
            chargedAt: Date | null;
            createdProduct: {
                id: string;
                name: string;
                isActive: boolean;
                slug: string;
            } | null;
            errorMessage: string | null;
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
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
