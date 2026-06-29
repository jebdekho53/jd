"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProductAiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductAiService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const merchant_service_1 = require("../merchant/merchant.service");
const category_service_1 = require("./category.service");
const product_service_1 = require("./product.service");
const product_duplicate_service_1 = require("./product-duplicate.service");
const merchant_ai_billing_service_1 = require("./merchant-ai-billing.service");
const merchant_ai_wallet_service_1 = require("./merchant-ai-wallet.service");
const ai_product_image_service_1 = require("./ai-product-image.service");
const openai_vision_client_1 = require("./openai-vision.client");
const product_return_policy_util_1 = require("../../common/utils/product-return-policy.util");
const product_ai_constants_1 = require("./product-ai.constants");
let ProductAiService = ProductAiService_1 = class ProductAiService {
    constructor(prisma, merchantService, imageService, visionClient, billing, wallet, productService, categoryService, duplicateService, audit) {
        this.prisma = prisma;
        this.merchantService = merchantService;
        this.imageService = imageService;
        this.visionClient = visionClient;
        this.billing = billing;
        this.wallet = wallet;
        this.productService = productService;
        this.categoryService = categoryService;
        this.duplicateService = duplicateService;
        this.audit = audit;
        this.logger = new common_1.Logger(ProductAiService_1.name);
    }
    async getAvailability(userId) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const wallet = await this.wallet.getOrCreateWallet(profile.id);
        return {
            available: this.visionClient.isConfigured(),
            message: this.visionClient.isConfigured()
                ? null
                : product_ai_constants_1.AI_PRODUCT_UNAVAILABLE_MESSAGE,
            code: this.visionClient.isConfigured() ? null : product_ai_constants_1.AI_NOT_CONFIGURED_CODE,
            pricePaise: this.billing.getPricePaise(),
            walletBalancePaise: wallet.balancePaise,
            walletBalanceRupee: wallet.balancePaise / 100,
            minimumRechargePaise: this.billing.getMinRechargePaise(),
            minimumRechargeRupee: this.billing.getMinRechargePaise() / 100,
            hasSufficientBalance: wallet.balancePaise >= this.billing.getPricePaise(),
        };
    }
    async analyzeImage(userId, storeId, dataUrl, ipAddress) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        await this.assertStoreOwnership(profile.id, storeId);
        this.visionClient.assertConfigured();
        await this.billing.assertDailyAnalysisLimit(profile.id);
        const images = await this.imageService.optimizeForAiAnalysis(dataUrl);
        const analysis = await this.prisma.aIProductAnalysis.create({
            data: {
                merchantProfileId: profile.id,
                storeId,
                uploadedImageUrl: images.optimizedUrl,
                originalImageUrl: images.originalUrl,
                optimizedImageUrl: images.optimizedUrl,
                thumbnailImageUrl: images.thumbnailUrl,
                aiAnalysisImageUrl: images.aiAnalysisUrl,
                status: client_1.AIProductAnalysisStatus.PROCESSING,
                chargeAmountPaise: this.billing.getPricePaise(),
            },
        });
        await this.audit.log({
            actorId: userId,
            action: 'AI_PRODUCT_ANALYSIS_STARTED',
            resourceType: 'AIProductAnalysis',
            resourceId: analysis.id,
            ipAddress,
            metadata: { storeId },
        });
        try {
            const extracted = await this.visionClient.analyzeProductImage(images.aiAnalysisUrl);
            const categoryMatch = await this.matchCategory(storeId, userId, extracted);
            const detectedProductType = this.mapProductType(extracted.productType, extracted.isSupplement);
            const updated = await this.prisma.aIProductAnalysis.update({
                where: { id: analysis.id },
                data: {
                    status: client_1.AIProductAnalysisStatus.COMPLETED,
                    extractedJson: {
                        ...extracted,
                        categoryMatch,
                    },
                    confidence: extracted.confidence,
                    detectedProductType,
                },
            });
            await this.audit.log({
                actorId: userId,
                action: 'AI_PRODUCT_ANALYSIS_COMPLETED',
                resourceType: 'AIProductAnalysis',
                resourceId: analysis.id,
                ipAddress,
                metadata: {
                    storeId,
                    confidence: extracted.confidence,
                },
            });
            return this.toMerchantView(updated, categoryMatch);
        }
        catch (e) {
            const message = e.message;
            await this.prisma.aIProductAnalysis.update({
                where: { id: analysis.id },
                data: {
                    status: client_1.AIProductAnalysisStatus.FAILED,
                    errorMessage: message,
                },
            });
            await this.audit.log({
                actorId: userId,
                action: 'AI_PRODUCT_ANALYSIS_FAILED',
                resourceType: 'AIProductAnalysis',
                resourceId: analysis.id,
                ipAddress,
                metadata: { storeId, error: message },
            });
            throw e;
        }
    }
    async getAnalysis(userId, storeId, analysisId) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const analysis = await this.findOwnedAnalysis(profile.id, storeId, analysisId);
        const categoryMatch = analysis.extractedJson?.categoryMatch;
        return this.toMerchantView(analysis, categoryMatch);
    }
    async confirmAnalysis(userId, storeId, analysisId, dto, ipAddress) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const analysis = await this.findOwnedAnalysis(profile.id, storeId, analysisId);
        if (analysis.status === client_1.AIProductAnalysisStatus.CONFIRMED) {
            return {
                alreadyConfirmed: true,
                productId: analysis.createdProductId,
                charged: false,
                amountPaise: analysis.chargeAmountPaise,
            };
        }
        if (analysis.status !== client_1.AIProductAnalysisStatus.COMPLETED) {
            throw new common_1.BadRequestException('Analysis must be completed before confirmation');
        }
        const extracted = (analysis.extractedJson ?? {});
        const supplementBlocked = Boolean(extracted.isSupplement) &&
            (extracted.canPublishDirectly === false ||
                extracted.labelReadable === false ||
                (analysis.confidence ?? 0) < product_ai_constants_1.AI_LOW_CONFIDENCE_THRESHOLD);
        if (dto.publish && supplementBlocked) {
            throw new common_1.BadRequestException('Supplement label is not clear. Please upload a clearer front-label image or save as draft.');
        }
        const confidence = analysis.confidence ?? 0;
        if (dto.publish && confidence < product_ai_constants_1.AI_LOW_CONFIDENCE_THRESHOLD) {
            throw new common_1.BadRequestException('Low confidence result. Please verify and save as draft only.');
        }
        const isRestaurantFood = analysis.detectedProductType === client_1.AIProductType.RESTAURANT_FOOD ||
            extracted.productType === 'RESTAURANT_FOOD';
        if (isRestaurantFood) {
            throw new common_1.BadRequestException('Restaurant dish photos cannot be published as grocery catalog products. Use menu management or menu OCR to add draft menu items.');
        }
        const productIndex = await this.duplicateService.loadStoreProductIndex(storeId);
        const duplicate = this.duplicateService.checkDuplicate(productIndex, {
            sku: dto.sku,
            name: dto.name,
            brand: dto.brand,
            unit: dto.unit ?? 'piece',
        });
        if (duplicate) {
            throw new common_1.BadRequestException(duplicate.message);
        }
        const charge = await this.billing.chargeForProductCreation(profile.id, storeId, analysisId, userId, ipAddress);
        await this.prisma.aIProductAnalysis.update({
            where: { id: analysisId },
            data: { chargedAt: new Date() },
        });
        const createDto = {
            name: dto.name,
            description: dto.description,
            brand: dto.brand,
            sku: dto.sku,
            categoryId: dto.categoryId,
            imageUrls: [analysis.optimizedImageUrl ?? analysis.uploadedImageUrl],
            basePrice: dto.basePrice,
            mrp: dto.mrp,
            unit: dto.unit ?? 'piece',
            quantity: dto.quantity ?? 0,
            tags: dto.tags,
            ingredients: dto.ingredients ?? extracted.ingredients ?? undefined,
            shelfLife: dto.shelfLife,
            countryOfOrigin: dto.countryOfOrigin,
            manufacturerName: dto.manufacturerName,
            fssaiLicense: dto.fssaiLicense,
            storageInstructions: dto.storageInstructions,
            hsnCodeId: dto.hsnCodeId,
            gstSlab: dto.gstSlab,
            taxCategory: dto.taxCategory,
            ...(dto.confirmReturnPolicy
                ? (0, product_return_policy_util_1.suggestDefaultReturnPolicy)({
                    productName: dto.name,
                    categorySlug: dto.categoryId,
                    isFood: Boolean(dto.fssaiLicense),
                })
                : {}),
        };
        try {
            const product = await this.productService.createProduct(userId, storeId, createDto, ipAddress);
            if (!dto.publish) {
                await this.productService.updateStatus(userId, storeId, product.id, {
                    isActive: false,
                });
            }
            await this.prisma.aIProductAnalysis.update({
                where: { id: analysisId },
                data: {
                    status: client_1.AIProductAnalysisStatus.CONFIRMED,
                    createdProductId: product.id,
                },
            });
            await this.audit.log({
                actorId: userId,
                action: 'AI_PRODUCT_CONFIRMED',
                resourceType: 'AIProductAnalysis',
                resourceId: analysisId,
                ipAddress,
                metadata: {
                    storeId,
                    productId: product.id,
                    charged: charge.charged,
                    amountPaise: charge.amountPaise,
                    publish: dto.publish,
                },
            });
            return {
                productId: product.id,
                productName: product.name,
                charged: charge.charged,
                amountPaise: charge.amountPaise,
                publish: dto.publish,
                chargedAt: new Date().toISOString(),
                analysisId,
                receipt: {
                    analysisId,
                    productName: product.name,
                    amountPaise: charge.amountPaise,
                    amountRupee: charge.amountPaise / 100,
                    chargedAt: new Date().toISOString(),
                    status: charge.charged ? 'CHARGED' : 'ALREADY_CHARGED',
                },
            };
        }
        catch (e) {
            await this.billing.refundOnProductCreationFailure(profile.id, storeId, analysisId, e.message, userId, ipAddress);
            throw e;
        }
    }
    async cancelAnalysis(userId, storeId, analysisId, ipAddress) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const analysis = await this.findOwnedAnalysis(profile.id, storeId, analysisId);
        if (analysis.status === client_1.AIProductAnalysisStatus.CONFIRMED) {
            throw new common_1.BadRequestException('Cannot cancel a confirmed analysis');
        }
        await this.prisma.aIProductAnalysis.update({
            where: { id: analysisId },
            data: { status: client_1.AIProductAnalysisStatus.CANCELLED },
        });
        await this.audit.log({
            actorId: userId,
            action: 'AI_PRODUCT_ANALYSIS_CANCELLED',
            resourceType: 'AIProductAnalysis',
            resourceId: analysisId,
            ipAddress,
            metadata: { storeId },
        });
        return { cancelled: true };
    }
    async listHistory(userId, storeId, page = 1, limit = 20) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const where = {
            merchantProfileId: profile.id,
            ...(storeId ? { storeId } : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.aIProductAnalysis.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    storeId: true,
                    uploadedImageUrl: true,
                    confidence: true,
                    status: true,
                    chargeAmountPaise: true,
                    chargedAt: true,
                    createdProductId: true,
                    errorMessage: true,
                    createdAt: true,
                },
            }),
            this.prisma.aIProductAnalysis.count({ where }),
        ]);
        return {
            items,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async listBilling(userId, storeId, page = 1, limit = 50) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        await this.assertStoreOwnership(profile.id, storeId);
        const where = { merchantProfileId: profile.id, storeId };
        const [transactions, total, debitAgg, refundAgg] = await Promise.all([
            this.prisma.merchantAiWalletTransaction.findMany({
                where: { merchantProfileId: profile.id, storeId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    analysis: {
                        select: {
                            id: true,
                            createdProductId: true,
                            extractedJson: true,
                            createdProduct: { select: { id: true, name: true } },
                        },
                    },
                },
            }),
            this.prisma.merchantAiWalletTransaction.count({ where: { merchantProfileId: profile.id, storeId } }),
            this.prisma.merchantAiWalletTransaction.aggregate({
                where: {
                    merchantProfileId: profile.id,
                    storeId,
                    type: client_1.MerchantAiWalletTransactionType.DEBIT,
                    status: client_1.MerchantAiWalletTransactionStatus.SUCCESS,
                },
                _sum: { amountPaise: true },
            }),
            this.prisma.merchantAiWalletTransaction.aggregate({
                where: {
                    merchantProfileId: profile.id,
                    storeId,
                    type: client_1.MerchantAiWalletTransactionType.REFUND,
                    status: client_1.MerchantAiWalletTransactionStatus.REFUNDED,
                },
                _sum: { amountPaise: true },
            }),
        ]);
        const wallet = await this.wallet.getOrCreateWallet(profile.id);
        const items = transactions.map((tx) => {
            const productName = tx.analysis?.createdProduct?.name ??
                tx.analysis?.extractedJson?.name ??
                (tx.type === client_1.MerchantAiWalletTransactionType.RECHARGE ? 'Wallet recharge' : '—');
            return {
                analysisId: tx.analysisId,
                productName,
                amountPaise: tx.amountPaise,
                amountRupee: tx.amountPaise / 100,
                status: tx.status,
                type: tx.type,
                chargedAt: tx.type === client_1.MerchantAiWalletTransactionType.DEBIT ? tx.createdAt : null,
                refundedAt: tx.type === client_1.MerchantAiWalletTransactionType.REFUND ? tx.createdAt : null,
                reason: tx.reason,
                createdAt: tx.createdAt,
            };
        });
        return {
            items,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
            walletBalancePaise: wallet.balancePaise,
            summary: {
                grossRevenuePaise: debitAgg._sum.amountPaise ?? 0,
                refundedPaise: refundAgg._sum.amountPaise ?? 0,
                netRevenuePaise: Math.max(0, (debitAgg._sum.amountPaise ?? 0) - (refundAgg._sum.amountPaise ?? 0)),
            },
        };
    }
    async matchCategory(storeId, userId, extracted) {
        const categories = await this.categoryService.listCategories(storeId, userId);
        let matchedCategoryId = null;
        let warning = null;
        const catName = extracted.categoryName?.trim().toLowerCase();
        const subName = extracted.subcategoryName?.trim().toLowerCase();
        for (const parent of categories) {
            if (subName) {
                for (const child of parent.children ?? []) {
                    if (child.name.toLowerCase() === subName ||
                        `${parent.name} ${child.name}`.toLowerCase().includes(subName)) {
                        matchedCategoryId = child.id;
                        break;
                    }
                }
            }
            if (!matchedCategoryId && catName && parent.name.toLowerCase() === catName) {
                matchedCategoryId = parent.id;
            }
            if (matchedCategoryId)
                break;
        }
        if ((catName || subName) && !matchedCategoryId) {
            warning = 'Suggested category was not found in your approved store categories';
        }
        return { matchedCategoryId, warning };
    }
    async findOwnedAnalysis(merchantProfileId, storeId, analysisId) {
        const analysis = await this.prisma.aIProductAnalysis.findFirst({
            where: { id: analysisId, merchantProfileId, storeId },
        });
        if (!analysis)
            throw new common_1.NotFoundException('Analysis not found');
        return analysis;
    }
    async assertStoreOwnership(merchantProfileId, storeId) {
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, merchantProfileId, deletedAt: null },
        });
        if (!store)
            throw new common_1.ForbiddenException('Store not found or not owned by you');
    }
    toMerchantView(analysis, categoryMatch) {
        const extracted = (analysis.extractedJson ?? {});
        const { categoryMatch: _cm, ...fields } = extracted;
        const supplementBlocked = Boolean(fields.isSupplement) &&
            (fields.canPublishDirectly === false || fields.labelReadable === false);
        return {
            id: analysis.id,
            storeId: analysis.storeId,
            uploadedImageUrl: analysis.uploadedImageUrl,
            originalImageUrl: analysis.originalImageUrl,
            optimizedImageUrl: analysis.optimizedImageUrl,
            thumbnailImageUrl: analysis.thumbnailImageUrl,
            extracted: fields,
            categoryMatch: categoryMatch ?? _cm ?? null,
            confidence: analysis.confidence,
            status: analysis.status,
            errorMessage: analysis.errorMessage,
            createdProductId: analysis.createdProductId,
            chargeAmountPaise: analysis.chargeAmountPaise,
            chargeAmountRupee: analysis.chargeAmountPaise / 100,
            chargedAt: analysis.chargedAt,
            createdAt: analysis.createdAt,
            lowConfidence: (analysis.confidence ?? 0) < product_ai_constants_1.AI_LOW_CONFIDENCE_THRESHOLD,
            publishBlocked: (analysis.confidence ?? 0) < product_ai_constants_1.AI_LOW_CONFIDENCE_THRESHOLD ||
                supplementBlocked ||
                fields.productType === 'RESTAURANT_FOOD' ||
                analysis.detectedProductType === client_1.AIProductType.RESTAURANT_FOOD,
            supplementBlocked,
            supplementWarning: supplementBlocked
                ? 'Supplement label is not clear. Please upload a clearer front-label image or save as draft.'
                : null,
            missingPrice: fields.sellingPrice == null && fields.mrp == null,
            isSupplement: Boolean(fields.isSupplement),
            labelReadable: fields.labelReadable ?? null,
            canPublishDirectly: fields.canPublishDirectly !== false && !supplementBlocked,
            imageQualityScore: fields.imageQualityScore ?? null,
            detectedProductType: analysis.detectedProductType,
            productType: fields.productType ?? analysis.detectedProductType,
        };
    }
    mapProductType(productType, isSupplement) {
        if (isSupplement)
            return client_1.AIProductType.SUPPLEMENT;
        const map = {
            PACKAGED_PRODUCT: client_1.AIProductType.PACKAGED_PRODUCT,
            FRESH_FOOD: client_1.AIProductType.FRESH_FOOD,
            RESTAURANT_FOOD: client_1.AIProductType.RESTAURANT_FOOD,
            SUPPLEMENT: client_1.AIProductType.SUPPLEMENT,
            ELECTRONICS: client_1.AIProductType.ELECTRONICS,
            BEAUTY: client_1.AIProductType.BEAUTY,
            PET: client_1.AIProductType.PET,
            FLOWERS: client_1.AIProductType.FLOWERS,
        };
        return map[productType ?? ''] ?? client_1.AIProductType.UNKNOWN;
    }
};
exports.ProductAiService = ProductAiService;
exports.ProductAiService = ProductAiService = ProductAiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        merchant_service_1.MerchantService,
        ai_product_image_service_1.AiProductImageService,
        openai_vision_client_1.OpenAiVisionClient,
        merchant_ai_billing_service_1.MerchantAiBillingService,
        merchant_ai_wallet_service_1.MerchantAiWalletService,
        product_service_1.ProductService,
        category_service_1.CategoryService,
        product_duplicate_service_1.ProductDuplicateService,
        audit_service_1.AuditService])
], ProductAiService);
//# sourceMappingURL=product-ai.service.js.map