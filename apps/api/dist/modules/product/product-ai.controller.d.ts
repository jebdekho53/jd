import { RequestUser } from '../../common/types';
import { ProductAiService } from './product-ai.service';
import { AnalyzeProductImageDto, ConfirmAiProductDto, ListAiHistoryDto } from './dto/product-ai.dto';
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
            walletBalancePaise: any;
            walletBalanceRupee: number;
            minimumRechargePaise: number;
            minimumRechargeRupee: number;
            hasSufficientBalance: boolean;
        };
    }>;
    billing(user: RequestUser, storeId: string, page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            items: any;
            meta: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
            walletBalancePaise: any;
            summary: {
                grossRevenuePaise: any;
                refundedPaise: any;
                netRevenuePaise: number;
            };
        };
    }>;
    analyze(user: RequestUser, storeId: string, dto: AnalyzeProductImageDto, ip: string): Promise<{
        success: boolean;
        data: {
            id: string;
            storeId: string;
            uploadedImageUrl: string;
            originalImageUrl: string | null | undefined;
            optimizedImageUrl: string | null | undefined;
            thumbnailImageUrl: string | null | undefined;
            extracted: {
                [x: string]: unknown;
            };
            categoryMatch: {} | null;
            confidence: number | null;
            status: AIProductAnalysisStatus;
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
            detectedProductType: any;
            productType: any;
        };
    }>;
    history(user: RequestUser, storeId: string, query: ListAiHistoryDto): Promise<{
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
    getAnalysis(user: RequestUser, storeId: string, analysisId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            storeId: string;
            uploadedImageUrl: string;
            originalImageUrl: string | null | undefined;
            optimizedImageUrl: string | null | undefined;
            thumbnailImageUrl: string | null | undefined;
            extracted: {
                [x: string]: unknown;
            };
            categoryMatch: {} | null;
            confidence: number | null;
            status: AIProductAnalysisStatus;
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
            detectedProductType: any;
            productType: any;
        };
    }>;
    confirm(user: RequestUser, storeId: string, analysisId: string, dto: ConfirmAiProductDto, ip: string): Promise<{
        success: boolean;
        data: {
            alreadyConfirmed: boolean;
            productId: any;
            charged: boolean;
            amountPaise: any;
            productName?: undefined;
            publish?: undefined;
            chargedAt?: undefined;
            analysisId?: undefined;
            receipt?: undefined;
        } | {
            productId: any;
            productName: any;
            charged: boolean;
            amountPaise: number;
            publish: boolean;
            chargedAt: string;
            analysisId: string;
            receipt: {
                analysisId: string;
                productName: any;
                amountPaise: number;
                amountRupee: number;
                chargedAt: string;
                status: string;
            };
            alreadyConfirmed?: undefined;
        };
    }>;
    cancel(user: RequestUser, storeId: string, analysisId: string, ip: string): Promise<{
        success: boolean;
        data: {
            cancelled: boolean;
        };
    }>;
}
