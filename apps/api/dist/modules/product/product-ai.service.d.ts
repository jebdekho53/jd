import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MerchantService } from '../merchant/merchant.service';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { ProductDuplicateService } from './product-duplicate.service';
import { MerchantAiBillingService } from './merchant-ai-billing.service';
import { MerchantAiWalletService } from './merchant-ai-wallet.service';
import { AiProductImageService } from './ai-product-image.service';
import { OpenAiVisionClient } from './openai-vision.client';
import { ConfirmAiProductDto } from './dto/product-ai.dto';
export declare class ProductAiService {
    private readonly prisma;
    private readonly merchantService;
    private readonly imageService;
    private readonly visionClient;
    private readonly billing;
    private readonly wallet;
    private readonly productService;
    private readonly categoryService;
    private readonly duplicateService;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, merchantService: MerchantService, imageService: AiProductImageService, visionClient: OpenAiVisionClient, billing: MerchantAiBillingService, wallet: MerchantAiWalletService, productService: ProductService, categoryService: CategoryService, duplicateService: ProductDuplicateService, audit: AuditService);
    getAvailability(userId: string): Promise<{
        available: boolean;
        message: string | null;
        code: string | null;
        pricePaise: number;
        walletBalancePaise: number;
        walletBalanceRupee: number;
        minimumRechargePaise: number;
        minimumRechargeRupee: number;
        hasSufficientBalance: boolean;
    }>;
    analyzeImage(userId: string, storeId: string, dataUrl: string, ipAddress?: string): Promise<{
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
    }>;
    getAnalysis(userId: string, storeId: string, analysisId: string): Promise<{
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
    }>;
    confirmAnalysis(userId: string, storeId: string, analysisId: string, dto: ConfirmAiProductDto, ipAddress?: string): Promise<{
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
    }>;
    cancelAnalysis(userId: string, storeId: string, analysisId: string, ipAddress?: string): Promise<{
        cancelled: boolean;
    }>;
    listHistory(userId: string, storeId: string | undefined, page?: number, limit?: number): Promise<{
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
    }>;
    listBilling(userId: string, storeId: string, page?: number, limit?: number): Promise<{
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
    }>;
    private matchCategory;
    private findOwnedAnalysis;
    private assertStoreOwnership;
    private toMerchantView;
    private mapProductType;
}
