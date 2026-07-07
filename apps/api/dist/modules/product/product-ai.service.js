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
const crypto_1 = require("crypto");
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
            imageGenerationPricePaise: this.wallet.getImageGenerationCostPaise(),
            imageGenerationPriceRupee: this.wallet.getImageGenerationCostPaise() / 100,
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
            const suggestions = this.buildFieldSuggestions(extracted, categoryMatch);
            const detectedProductType = this.mapProductType(extracted.productType, extracted.isSupplement);
            const updated = await this.prisma.aIProductAnalysis.update({
                where: { id: analysis.id },
                data: {
                    status: client_1.AIProductAnalysisStatus.COMPLETED,
                    extractedJson: {
                        ...extracted,
                        categoryMatch,
                        fields: suggestions.fields,
                        missingFields: suggestions.missingFields,
                        warnings: suggestions.warnings,
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
            try {
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
            }
            catch (recordFailureError) {
                this.logger.error(`Failed to record AI product analysis failure for ${analysis.id}`, recordFailureError instanceof Error ? recordFailureError.stack : undefined);
            }
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
        if (dto.publish && supplementBlocked && !dto.supplementComplianceConfirmed) {
            throw new common_1.BadRequestException('Supplement label is not clear. Confirm you have verified ingredients, FSSAI and compliance details, or save as draft.');
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
        const allowedImageUrls = new Set([
            analysis.optimizedImageUrl,
            analysis.uploadedImageUrl,
            ...(Array.isArray(extracted.generatedImages)
                ? extracted.generatedImages.map((g) => g?.url)
                : []),
        ].filter((u) => Boolean(u)));
        const primaryImageUrl = dto.primaryImageUrl && allowedImageUrls.has(dto.primaryImageUrl)
            ? dto.primaryImageUrl
            : (analysis.optimizedImageUrl ?? analysis.uploadedImageUrl);
        const createDto = {
            name: dto.name,
            description: dto.description,
            brand: dto.brand,
            sku: dto.sku,
            categoryId: dto.categoryId,
            imageUrls: [primaryImageUrl],
            basePrice: dto.basePrice,
            mrp: dto.mrp,
            unit: dto.unit ?? 'piece',
            quantity: dto.quantity ?? 0,
            lowStockThreshold: dto.lowStockThreshold,
            tags: dto.tags,
            ingredients: dto.ingredients ?? extracted.ingredients ?? undefined,
            shelfLife: dto.shelfLife,
            countryOfOrigin: dto.countryOfOrigin,
            manufacturerName: dto.manufacturerName,
            manufacturerAddress: dto.manufacturerAddress,
            fssaiLicense: dto.fssaiLicense,
            storageInstructions: dto.storageInstructions,
            disclaimer: dto.disclaimer,
            taxInclusive: dto.taxInclusive,
            hsnCodeId: dto.hsnCodeId,
            gstSlab: dto.gstSlab,
            taxCategory: dto.taxCategory,
            isReturnable: dto.isReturnable,
            isRefundable: dto.isRefundable,
            isReplaceable: dto.isReplaceable,
            returnWindowHours: dto.returnWindowHours,
            approvalMode: this.normalizeClaimEnum(dto.approvalMode, ['AUTO', 'MANUAL']),
            proofRequired: this.normalizeProofRequirement(dto.proofRequired),
            refundMethod: this.normalizeClaimEnum(dto.refundMethod, ['ORIGINAL_PAYMENT', 'WALLET', 'BOTH']),
            allowCustomerChangedMind: dto.allowCustomerChangedMind,
            returnPolicyText: dto.returnPolicyText,
            replacementPolicyText: dto.replacementPolicyText,
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
    async generateProductImage(userId, storeId, analysisId, mode = 'bg_removal', ipAddress) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const analysis = await this.findOwnedAnalysis(profile.id, storeId, analysisId);
        const cost = this.wallet.getImageGenerationCostPaise();
        const wallet = await this.wallet.getOrCreateWallet(profile.id);
        if (wallet.balancePaise < cost) {
            throw new common_1.HttpException({
                message: 'Insufficient AI wallet balance to generate an image. Please recharge.',
                code: 'INSUFFICIENT_AI_WALLET',
            }, common_1.HttpStatus.PAYMENT_REQUIRED);
        }
        const extracted = (analysis.extractedJson ?? {});
        const sourceUrl = analysis.originalImageUrl ?? analysis.optimizedImageUrl ?? analysis.uploadedImageUrl;
        let images;
        let prompt = 'background-removal';
        if (mode === 'ai_edit') {
            this.visionClient.assertConfigured();
            prompt = this.buildImageEditPrompt(extracted);
            const source = await this.imageService.loadStoredImage(sourceUrl);
            const buffer = await this.visionClient.editProductImage(source, prompt);
            images = await this.imageService.saveGeneratedImage(buffer);
        }
        else {
            images = await this.imageService.cleanBackgroundFromStored(sourceUrl);
        }
        const charge = await this.wallet.debitForImageGeneration(profile.id, storeId, analysisId, (0, crypto_1.randomUUID)(), userId, ipAddress);
        const previous = Array.isArray(extracted.generatedImages)
            ? extracted.generatedImages
            : [];
        const generatedImages = [
            ...previous,
            {
                url: images.optimizedUrl,
                thumbnailUrl: images.thumbnailUrl,
                mode,
                prompt,
                createdAt: new Date().toISOString(),
            },
        ].slice(-10);
        await this.prisma.aIProductAnalysis.update({
            where: { id: analysisId },
            data: {
                extractedJson: { ...extracted, generatedImages },
            },
        });
        await this.audit.log({
            actorId: userId,
            action: 'AI_PRODUCT_IMAGE_GENERATED',
            resourceType: 'AIProductAnalysis',
            resourceId: analysisId,
            ipAddress,
            metadata: { storeId, amountPaise: charge.amountPaise },
        });
        return {
            imageUrl: images.optimizedUrl,
            thumbnailUrl: images.thumbnailUrl,
            generatedImages,
            amountPaise: charge.amountPaise,
            amountRupee: charge.amountPaise / 100,
            walletBalancePaise: charge.balancePaise,
            walletBalanceRupee: charge.balancePaise / 100,
        };
    }
    buildImageEditPrompt(extracted) {
        const category = extracted.categoryName || 'product';
        return (`Keep this exact ${category} product and its printed label and text unchanged. ` +
            `Do not alter, redraw, or replace any text, logo, or packaging design. ` +
            `Only replace the background with a clean, seamless, bright white studio backdrop, ` +
            `with soft even studio lighting and a subtle natural shadow beneath the product. ` +
            `Photorealistic, commercial-grade product shot. No extra props, no watermarks.`);
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
        const suggestions = (extracted.fields && typeof extracted.fields === 'object')
            ? extracted.fields
            : this.buildFieldSuggestions(fields, (categoryMatch ?? _cm)).fields;
        const missingFields = Array.isArray(extracted.missingFields)
            ? extracted.missingFields
            : this.findMissingFields(suggestions);
        const warnings = Array.isArray(extracted.warnings)
            ? extracted.warnings
            : this.buildWarnings(fields, categoryMatch ?? _cm);
        const supplementBlocked = Boolean(fields.isSupplement) &&
            (fields.canPublishDirectly === false || fields.labelReadable === false);
        return {
            analysisId: analysis.id,
            id: analysis.id,
            storeId: analysis.storeId,
            ocrText: typeof fields.ocrText === 'string' ? fields.ocrText : '',
            fields: suggestions,
            missingFields,
            warnings,
            uploadedImageUrl: analysis.uploadedImageUrl,
            originalImageUrl: analysis.originalImageUrl,
            optimizedImageUrl: analysis.optimizedImageUrl,
            thumbnailImageUrl: analysis.thumbnailImageUrl,
            generatedImages: Array.isArray(extracted.generatedImages) ? extracted.generatedImages : [],
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
    buildFieldSuggestions(extracted, categoryMatch) {
        const confidence = this.clamp01(extracted.confidence);
        const hasOcr = Boolean(extracted.ocrText?.trim());
        const ocrConfidence = hasOcr ? Math.max(confidence, 0.65) : confidence;
        const safeSku = this.buildSku(extracted.brand, extracted.name, extracted.barcode);
        const categoryId = categoryMatch?.matchedCategoryId ?? null;
        const hsnCode = this.normalizeHsnCode(extracted.hsnCode);
        const gstSlab = this.gstPercentToSlab(extracted.gstPercent);
        const fields = {
            name: this.field(extracted.name || null, confidence, extracted.name ? 'ocr' : 'merchant_required'),
            productName: this.field(extracted.name || null, confidence, extracted.name ? 'ocr' : 'merchant_required'),
            description: this.field(extracted.description || this.defaultDescription(extracted), extracted.description ? ocrConfidence : 0.55, extracted.description ? 'ocr' : 'ai_inferred', !extracted.description),
            brand: this.field(extracted.brand || null, confidence, extracted.brand ? 'ocr' : 'merchant_required'),
            sku: this.field(extracted.sku || safeSku, extracted.sku ? ocrConfidence : 0.6, extracted.sku ? 'ocr' : 'ai_inferred', !extracted.sku),
            categoryId: this.field(categoryId, categoryId ? 0.8 : 0, categoryId ? 'ai_inferred' : 'merchant_required', Boolean(categoryId)),
            subcategoryId: this.field(categoryId, categoryId ? 0.8 : 0, categoryId ? 'ai_inferred' : 'merchant_required', Boolean(categoryId)),
            price: this.field(extracted.sellingPrice, extracted.sellingPrice == null ? 0 : ocrConfidence, extracted.sellingPrice == null ? 'merchant_required' : 'ocr'),
            basePrice: this.field(extracted.sellingPrice, extracted.sellingPrice == null ? 0 : ocrConfidence, extracted.sellingPrice == null ? 'merchant_required' : 'ocr'),
            mrp: this.field(extracted.mrp, extracted.mrp == null ? 0 : ocrConfidence, extracted.mrp == null ? 'merchant_required' : 'ocr'),
            unit: this.field(extracted.unit || this.unitFromWeight(extracted.weight) || 'piece', extracted.unit ? ocrConfidence : 0.5, extracted.unit ? 'ocr' : 'default', !extracted.unit),
            openingStock: this.field(10, 0.4, 'default', true),
            quantity: this.field(10, 0.4, 'default', true),
            lowStockAlert: this.field(5, 0.4, 'default', true),
            lowStockThreshold: this.field(5, 0.4, 'default', true),
            taxCategory: this.field('GOODS', 0.8, 'default', true),
            hsnCode: this.field(hsnCode, hsnCode ? 0.55 : 0, hsnCode ? 'ocr' : 'merchant_required', true),
            gstPercent: this.field(extracted.gstPercent ?? null, extracted.gstPercent == null ? 0 : 0.55, extracted.gstPercent == null ? 'merchant_required' : 'ocr', true),
            gstSlab: this.field(gstSlab, gstSlab ? 0.55 : 0, gstSlab ? 'ocr' : 'merchant_required', true),
            ingredients: this.field(extracted.ingredients, extracted.ingredients ? ocrConfidence : 0, extracted.ingredients ? 'ocr' : 'merchant_required', Boolean(extracted.ingredients)),
            shelfLife: this.field(extracted.shelfLife, extracted.shelfLife ? ocrConfidence : 0, extracted.shelfLife ? 'ocr' : 'merchant_required', Boolean(extracted.shelfLife)),
            countryOfOrigin: this.field(extracted.countryOfOrigin, extracted.countryOfOrigin ? ocrConfidence : 0, extracted.countryOfOrigin ? 'ocr' : 'merchant_required', Boolean(extracted.countryOfOrigin)),
            manufacturerName: this.field(extracted.manufacturerName, extracted.manufacturerName ? ocrConfidence : 0, extracted.manufacturerName ? 'ocr' : 'merchant_required', Boolean(extracted.manufacturerName)),
            manufacturerAddress: this.field(extracted.manufacturerAddress, extracted.manufacturerAddress ? ocrConfidence : 0, extracted.manufacturerAddress ? 'ocr' : 'merchant_required', Boolean(extracted.manufacturerAddress)),
            storageInstructions: this.field(extracted.storageInstructions, extracted.storageInstructions ? ocrConfidence : 0, extracted.storageInstructions ? 'ocr' : 'merchant_required', Boolean(extracted.storageInstructions)),
            disclaimer: this.field(extracted.disclaimer || this.defaultDisclaimer(extracted), extracted.disclaimer ? ocrConfidence : 0.6, extracted.disclaimer ? 'ocr' : 'ai_inferred', true),
            returnAllowed: this.field(!extracted.isSupplement && extracted.productType !== 'RESTAURANT_FOOD', 0.55, 'default', true),
            refundAllowed: this.field(true, 0.55, 'default', true),
            replacementAllowed: this.field(true, 0.55, 'default', true),
            returnWindowHours: this.field(extracted.productType === 'FRESH_FOOD' ? 2 : 24, 0.5, 'default', true),
            proofRequired: this.field('PHOTO_AND_VIDEO', 0.5, 'default', true),
            approvalMode: this.field('MANUAL', 0.5, 'default', true),
            autoApproveBelow: this.field(null, 0, 'merchant_required', true),
            refundMethod: this.field('ORIGINAL_PAYMENT', 0.5, 'default', true),
            foodPolicy: this.field(extracted.productType === 'RESTAURANT_FOOD' ? 'REFUND_ONLY' : null, extracted.productType === 'RESTAURANT_FOOD' ? 0.5 : 0, extracted.productType === 'RESTAURANT_FOOD' ? 'default' : 'merchant_required', true),
            allowCustomerChangedMind: this.field(false, 0.6, 'default', true),
            eligibleReturnReasons: this.field(['WRONG_ITEM', 'DAMAGED', 'MISSING_ITEM', 'QUALITY_ISSUE', 'EXPIRED_PRODUCT', 'PACKAGING_DAMAGED', 'NOT_AS_DESCRIBED', 'OTHER'], 0.55, 'default', true),
            returnPolicyText: this.field('AI suggested return rules. Merchant must verify category, shelf-life, and regulatory restrictions before saving.', 0.5, 'default', true),
            replacementPolicyText: this.field('Replacement is suggested only for wrong, damaged, missing, or not-as-described items after merchant review.', 0.5, 'default', true),
            priceInclusiveOfTax: this.field(true, 0.5, 'default', true),
        };
        const inferred = new Set((extracted.inferredFields ?? []).map((f) => String(f)));
        const aliasToSchemaKey = {
            productName: 'name',
            basePrice: 'sellingPrice',
            price: 'sellingPrice',
            gstSlab: 'gstPercent',
        };
        for (const [key, f] of Object.entries(fields)) {
            const schemaKey = aliasToSchemaKey[key] ?? key;
            if (f.source === 'ocr' && inferred.has(schemaKey)) {
                f.source = 'ai_inferred';
                f.requiresReview = true;
            }
        }
        return {
            fields,
            missingFields: this.findMissingFields(fields),
            warnings: this.buildWarnings(extracted, categoryMatch),
        };
    }
    field(value, confidence, source, requiresReview = source !== 'ocr') {
        return {
            value: value === undefined ? null : value,
            confidence: this.clamp01(confidence),
            source,
            ...(requiresReview ? { requiresReview: true } : {}),
        };
    }
    findMissingFields(fields) {
        return Object.entries(fields)
            .filter(([, field]) => field.source === 'merchant_required' || field.value === null || field.value === '')
            .map(([key]) => key);
    }
    buildWarnings(extracted, categoryMatch) {
        const warnings = [];
        const match = categoryMatch;
        if (match?.warning)
            warnings.push(match.warning);
        if (!match?.matchedCategoryId)
            warnings.push('Category could not be confidently mapped to approved store categories.');
        if (!extracted.mrp && !extracted.sellingPrice)
            warnings.push('Price/MRP was not visible. Merchant must enter price before saving.');
        if (!extracted.hsnCode)
            warnings.push('HSN/GST was not visible. Merchant must verify tax details before saving.');
        if (extracted.isSupplement)
            warnings.push('Supplement/regulatory fields are sensitive. Verify ingredients, allergens, FSSAI, manufacturer, and label details.');
        return [...new Set(warnings)];
    }
    defaultDescription(extracted) {
        const parts = [extracted.brand, extracted.name, extracted.weight || extracted.unit].filter(Boolean);
        return parts.length >= 2 ? parts.join(' ') : null;
    }
    defaultDisclaimer(extracted) {
        return extracted.isSupplement
            ? 'AI suggested supplement details from the uploaded label. Merchant must verify ingredients, allergens, FSSAI/regulatory details, manufacturer information, pricing, and claims before saving.'
            : 'AI suggested product details from the uploaded image. Merchant must verify label, pricing, tax, manufacturer, and regulatory details before saving.';
    }
    buildSku(brand, name, barcode) {
        if (barcode)
            return barcode.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 50) || null;
        const text = [brand, name].filter(Boolean).join(' ');
        const slug = text
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 40);
        return slug ? `${slug}-${Date.now().toString().slice(-6)}` : null;
    }
    unitFromWeight(weight) {
        const value = weight?.trim().toLowerCase();
        if (!value)
            return null;
        if (/\b(kg|g|gram|grams)\b/.test(value))
            return value;
        if (/\b(ml|l|litre|liter)\b/.test(value))
            return value;
        return null;
    }
    normalizeHsnCode(value) {
        const normalized = value?.replace(/[^\d]/g, '') ?? '';
        return /^\d{4}(\d{2}){0,2}$/.test(normalized) ? normalized : null;
    }
    gstPercentToSlab(value) {
        if (value == null)
            return null;
        if (value === 0)
            return 'ZERO';
        if (value === 5)
            return 'FIVE';
        if (value === 12)
            return 'TWELVE';
        if (value === 18)
            return 'EIGHTEEN';
        if (value === 28)
            return 'TWENTY_EIGHT';
        return null;
    }
    clamp01(value) {
        const n = Number(value);
        if (!Number.isFinite(n))
            return 0;
        return Math.min(1, Math.max(0, n));
    }
    normalizeClaimEnum(value, allowed) {
        if (!value)
            return undefined;
        const upper = value.trim().toUpperCase();
        return allowed.includes(upper) ? upper : undefined;
    }
    normalizeProofRequirement(value) {
        if (!value)
            return undefined;
        const upper = value.trim().toUpperCase();
        if (upper === 'PHOTO_AND_VIDEO' || upper === 'PHOTO_VIDEO')
            return 'PHOTO_AND_VIDEO';
        const allowed = ['NONE', 'PHOTO', 'VIDEO', 'PHOTO_AND_VIDEO'];
        return allowed.includes(upper) ? upper : undefined;
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