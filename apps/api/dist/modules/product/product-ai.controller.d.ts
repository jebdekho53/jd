import { RequestUser } from '../../common/types';
import { ProductAiService } from './product-ai.service';
import { AnalyzeProductImageDto, ConfirmAiProductDto, GenerateProductImageDto, ListAiHistoryDto } from './dto/product-ai.dto';
export declare class ProductAiController {
    private readonly aiService;
    constructor(aiService: ProductAiService);
    availability(user: RequestUser, _storeId: string): Promise<{
        success: boolean;
        data: {
            available: boolean;
            message: string | null;
            code: string | null;
            pricePaise: number;
            walletBalancePaise: number;
            walletBalanceRupee: number;
            minimumRechargePaise: number;
            minimumRechargeRupee: number;
            hasSufficientBalance: boolean;
            imageGenerationPricePaise: number;
            imageGenerationPriceRupee: number;
        };
    }>;
    billing(user: RequestUser, storeId: string, page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            items: {
                analysisId: string | null;
                productName: string;
                amountPaise: number;
                amountRupee: number;
                status: import("@prisma/client").$Enums.MerchantAiWalletTransactionStatus;
                type: import("@prisma/client").$Enums.MerchantAiWalletTransactionType;
                chargedAt: Date | null;
                refundedAt: Date | null;
                reason: string | null;
                createdAt: Date;
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
            walletBalancePaise: number;
            summary: {
                grossRevenuePaise: number;
                refundedPaise: number;
                netRevenuePaise: number;
            };
        };
    }>;
    analyze(user: RequestUser, storeId: string, dto: AnalyzeProductImageDto, ip: string): Promise<{
        success: boolean;
        data: {
            analysisId: string;
            id: string;
            storeId: string;
            ocrText: string;
            fields: object;
            missingFields: any[];
            warnings: any[];
            uploadedImageUrl: string;
            originalImageUrl: string | null | undefined;
            optimizedImageUrl: string | null | undefined;
            thumbnailImageUrl: string | null | undefined;
            generatedImages: any[];
            extracted: {
                [x: string]: unknown;
            };
            categoryMatch: {} | null;
            confidence: number | null;
            status: import("@prisma/client").$Enums.AIProductAnalysisStatus;
            errorMessage: string | null;
            createdProductId: string | null;
            chargeAmountPaise: number;
            chargeAmountRupee: number;
            chargedAt: Date | null;
            createdAt: Date;
            lowConfidence: boolean;
            publishBlocked: boolean;
            supplementBlocked: boolean;
            supplementWarning: string | null;
            missingPrice: boolean;
            isSupplement: boolean;
            labelReadable: {} | null;
            canPublishDirectly: boolean;
            imageQualityScore: {} | null;
            detectedProductType: import("@prisma/client").$Enums.AIProductType | null | undefined;
            productType: {} | null | undefined;
        };
    }>;
    history(user: RequestUser, storeId: string, query: ListAiHistoryDto): Promise<{
        success: boolean;
        data: {
            items: {
                id: string;
                status: import("@prisma/client").$Enums.AIProductAnalysisStatus;
                errorMessage: string | null;
                createdAt: Date;
                storeId: string;
                uploadedImageUrl: string;
                confidence: number | null;
                createdProductId: string | null;
                chargeAmountPaise: number;
                chargedAt: Date | null;
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getAnalysis(user: RequestUser, storeId: string, analysisId: string): Promise<{
        success: boolean;
        data: {
            analysisId: string;
            id: string;
            storeId: string;
            ocrText: string;
            fields: object;
            missingFields: any[];
            warnings: any[];
            uploadedImageUrl: string;
            originalImageUrl: string | null | undefined;
            optimizedImageUrl: string | null | undefined;
            thumbnailImageUrl: string | null | undefined;
            generatedImages: any[];
            extracted: {
                [x: string]: unknown;
            };
            categoryMatch: {} | null;
            confidence: number | null;
            status: import("@prisma/client").$Enums.AIProductAnalysisStatus;
            errorMessage: string | null;
            createdProductId: string | null;
            chargeAmountPaise: number;
            chargeAmountRupee: number;
            chargedAt: Date | null;
            createdAt: Date;
            lowConfidence: boolean;
            publishBlocked: boolean;
            supplementBlocked: boolean;
            supplementWarning: string | null;
            missingPrice: boolean;
            isSupplement: boolean;
            labelReadable: {} | null;
            canPublishDirectly: boolean;
            imageQualityScore: {} | null;
            detectedProductType: import("@prisma/client").$Enums.AIProductType | null | undefined;
            productType: {} | null | undefined;
        };
    }>;
    confirm(user: RequestUser, storeId: string, analysisId: string, dto: ConfirmAiProductDto, ip: string): Promise<{
        success: boolean;
        data: {
            alreadyConfirmed: boolean;
            productId: string | null;
            charged: boolean;
            amountPaise: number;
            productName?: undefined;
            publish?: undefined;
            chargedAt?: undefined;
            analysisId?: undefined;
            receipt?: undefined;
        } | {
            productId: string;
            productName: string;
            charged: boolean;
            amountPaise: number;
            publish: boolean;
            chargedAt: string;
            analysisId: string;
            receipt: {
                analysisId: string;
                productName: string;
                amountPaise: number;
                amountRupee: number;
                chargedAt: string;
                status: string;
            };
            alreadyConfirmed?: undefined;
        };
    }>;
    generateImage(user: RequestUser, storeId: string, analysisId: string, dto: GenerateProductImageDto, ip: string): Promise<{
        success: boolean;
        data: {
            imageUrl: string;
            thumbnailUrl: string;
            generatedImages: unknown[];
            amountPaise: number;
            amountRupee: number;
            walletBalancePaise: number;
            walletBalanceRupee: number;
        };
    }>;
    cancel(user: RequestUser, storeId: string, analysisId: string, ip: string): Promise<{
        success: boolean;
        data: {
            cancelled: boolean;
        };
    }>;
}
