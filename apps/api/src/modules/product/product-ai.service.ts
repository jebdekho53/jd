import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AIProductAnalysisStatus, AIProductType, MerchantAiWalletTransactionStatus, MerchantAiWalletTransactionType, Prisma } from '@prisma/client';
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
import type { AiExtractedProduct } from './openai-vision.client';
import { ConfirmAiProductDto } from './dto/product-ai.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { suggestDefaultReturnPolicy } from '../../common/utils/product-return-policy.util';
import {
  AI_LOW_CONFIDENCE_THRESHOLD,
  AI_NOT_CONFIGURED_CODE,
  AI_PRODUCT_UNAVAILABLE_MESSAGE,
} from './product-ai.constants';

type AiFieldSource = 'ocr' | 'ai_inferred' | 'default' | 'merchant_required';

type AiSuggestionField<T = unknown> = {
  value: T | null;
  confidence: number;
  source: AiFieldSource;
  requiresReview?: boolean;
};

type AiProductFieldSuggestions = Record<string, AiSuggestionField>;

@Injectable()
export class ProductAiService {
  private readonly logger = new Logger(ProductAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
    private readonly imageService: AiProductImageService,
    private readonly visionClient: OpenAiVisionClient,
    private readonly billing: MerchantAiBillingService,
    private readonly wallet: MerchantAiWalletService,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly duplicateService: ProductDuplicateService,
    private readonly audit: AuditService,
  ) {}

  async getAvailability(userId: string) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const wallet = await this.wallet.getOrCreateWallet(profile.id);
    return {
      available: this.visionClient.isConfigured(),
      message: this.visionClient.isConfigured()
        ? null
        : AI_PRODUCT_UNAVAILABLE_MESSAGE,
      code: this.visionClient.isConfigured() ? null : AI_NOT_CONFIGURED_CODE,
      pricePaise: this.billing.getPricePaise(),
      walletBalancePaise: wallet.balancePaise,
      walletBalanceRupee: wallet.balancePaise / 100,
      minimumRechargePaise: this.billing.getMinRechargePaise(),
      minimumRechargeRupee: this.billing.getMinRechargePaise() / 100,
      hasSufficientBalance: wallet.balancePaise >= this.billing.getPricePaise(),
    };
  }

  async analyzeImage(userId: string, storeId: string, dataUrl: string, ipAddress?: string) {
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
        status: AIProductAnalysisStatus.PROCESSING,
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
          status: AIProductAnalysisStatus.COMPLETED,
          extractedJson: {
            ...extracted,
            categoryMatch,
            fields: suggestions.fields,
            missingFields: suggestions.missingFields,
            warnings: suggestions.warnings,
          } as Prisma.InputJsonValue,
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
    } catch (e) {
      const message = (e as Error).message;
      try {
        await this.prisma.aIProductAnalysis.update({
          where: { id: analysis.id },
          data: {
            status: AIProductAnalysisStatus.FAILED,
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
      } catch (recordFailureError) {
        this.logger.error(
          `Failed to record AI product analysis failure for ${analysis.id}`,
          recordFailureError instanceof Error ? recordFailureError.stack : undefined,
        );
      }

      throw e;
    }
  }

  async getAnalysis(userId: string, storeId: string, analysisId: string) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const analysis = await this.findOwnedAnalysis(profile.id, storeId, analysisId);
    const categoryMatch = (analysis.extractedJson as Record<string, unknown> | null)?.categoryMatch;
    return this.toMerchantView(analysis, categoryMatch);
  }

  async confirmAnalysis(
    userId: string,
    storeId: string,
    analysisId: string,
    dto: ConfirmAiProductDto,
    ipAddress?: string,
  ) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const analysis = await this.findOwnedAnalysis(profile.id, storeId, analysisId);

    if (analysis.status === AIProductAnalysisStatus.CONFIRMED) {
      return {
        alreadyConfirmed: true,
        productId: analysis.createdProductId,
        charged: false,
        amountPaise: analysis.chargeAmountPaise,
      };
    }

    if (analysis.status !== AIProductAnalysisStatus.COMPLETED) {
      throw new BadRequestException('Analysis must be completed before confirmation');
    }

    const extracted = (analysis.extractedJson ?? {}) as Record<string, unknown>;
    const supplementBlocked =
      Boolean(extracted.isSupplement) &&
      (extracted.canPublishDirectly === false ||
        extracted.labelReadable === false ||
        (analysis.confidence ?? 0) < AI_LOW_CONFIDENCE_THRESHOLD);

    if (dto.publish && supplementBlocked) {
      throw new BadRequestException(
        'Supplement label is not clear. Please upload a clearer front-label image or save as draft.',
      );
    }

    const confidence = analysis.confidence ?? 0;
    if (dto.publish && confidence < AI_LOW_CONFIDENCE_THRESHOLD) {
      throw new BadRequestException(
        'Low confidence result. Please verify and save as draft only.',
      );
    }

    const isRestaurantFood =
      analysis.detectedProductType === AIProductType.RESTAURANT_FOOD ||
      extracted.productType === 'RESTAURANT_FOOD';
    if (isRestaurantFood) {
      throw new BadRequestException(
        'Restaurant dish photos cannot be published as grocery catalog products. Use menu management or menu OCR to add draft menu items.',
      );
    }

    const productIndex = await this.duplicateService.loadStoreProductIndex(storeId);
    const duplicate = this.duplicateService.checkDuplicate(productIndex, {
      sku: dto.sku,
      name: dto.name,
      brand: dto.brand,
      unit: dto.unit ?? 'piece',
    });
    if (duplicate) {
      throw new BadRequestException(duplicate.message);
    }

    const charge = await this.billing.chargeForProductCreation(
      profile.id,
      storeId,
      analysisId,
      userId,
      ipAddress,
    );

    await this.prisma.aIProductAnalysis.update({
      where: { id: analysisId },
      data: { chargedAt: new Date() },
    });

    const createDto: CreateProductDto = {
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
      ingredients: dto.ingredients ?? (extracted.ingredients as string | undefined) ?? undefined,
      shelfLife: dto.shelfLife,
      countryOfOrigin: dto.countryOfOrigin,
      manufacturerName: dto.manufacturerName,
      fssaiLicense: dto.fssaiLicense,
      storageInstructions: dto.storageInstructions,
      hsnCodeId: dto.hsnCodeId,
      gstSlab: dto.gstSlab,
      taxCategory: dto.taxCategory,
      ...(dto.confirmReturnPolicy
        ? (suggestDefaultReturnPolicy({
            productName: dto.name,
            categorySlug: dto.categoryId,
            isFood: Boolean(dto.fssaiLicense),
          }) as Partial<CreateProductDto>)
        : {}),
    };

    try {
      const product = await this.productService.createProduct(
        userId,
        storeId,
        createDto,
        ipAddress,
      );

      if (!dto.publish) {
        await this.productService.updateStatus(userId, storeId, product.id, {
          isActive: false,
        });
      }

      await this.prisma.aIProductAnalysis.update({
        where: { id: analysisId },
        data: {
          status: AIProductAnalysisStatus.CONFIRMED,
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
    } catch (e) {
      await this.billing.refundOnProductCreationFailure(
        profile.id,
        storeId,
        analysisId,
        (e as Error).message,
        userId,
        ipAddress,
      );
      throw e;
    }
  }

  async cancelAnalysis(userId: string, storeId: string, analysisId: string, ipAddress?: string) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const analysis = await this.findOwnedAnalysis(profile.id, storeId, analysisId);

    if (analysis.status === AIProductAnalysisStatus.CONFIRMED) {
      throw new BadRequestException('Cannot cancel a confirmed analysis');
    }

    await this.prisma.aIProductAnalysis.update({
      where: { id: analysisId },
      data: { status: AIProductAnalysisStatus.CANCELLED },
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

  async listHistory(
    userId: string,
    storeId: string | undefined,
    page = 1,
    limit = 20,
  ) {
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

  async listBilling(userId: string, storeId: string, page = 1, limit = 50) {
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
          type: MerchantAiWalletTransactionType.DEBIT,
          status: MerchantAiWalletTransactionStatus.SUCCESS,
        },
        _sum: { amountPaise: true },
      }),
      this.prisma.merchantAiWalletTransaction.aggregate({
        where: {
          merchantProfileId: profile.id,
          storeId,
          type: MerchantAiWalletTransactionType.REFUND,
          status: MerchantAiWalletTransactionStatus.REFUNDED,
        },
        _sum: { amountPaise: true },
      }),
    ]);

    const wallet = await this.wallet.getOrCreateWallet(profile.id);

    const items = transactions.map((tx) => {
      const productName =
        tx.analysis?.createdProduct?.name ??
        ((tx.analysis?.extractedJson as Record<string, unknown> | null)?.name as string | undefined) ??
        (tx.type === MerchantAiWalletTransactionType.RECHARGE ? 'Wallet recharge' : '—');

      return {
        analysisId: tx.analysisId,
        productName,
        amountPaise: tx.amountPaise,
        amountRupee: tx.amountPaise / 100,
        status: tx.status,
        type: tx.type,
        chargedAt: tx.type === MerchantAiWalletTransactionType.DEBIT ? tx.createdAt : null,
        refundedAt: tx.type === MerchantAiWalletTransactionType.REFUND ? tx.createdAt : null,
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
        netRevenuePaise: Math.max(
          0,
          (debitAgg._sum.amountPaise ?? 0) - (refundAgg._sum.amountPaise ?? 0),
        ),
      },
    };
  }

  private async matchCategory(
    storeId: string,
    userId: string,
    extracted: { categoryName: string; subcategoryName: string },
  ) {
    const categories = await this.categoryService.listCategories(storeId, userId);
    let matchedCategoryId: string | null = null;
    let warning: string | null = null;

    const catName = extracted.categoryName?.trim().toLowerCase();
    const subName = extracted.subcategoryName?.trim().toLowerCase();

    for (const parent of categories as { id: string; name: string; children?: { id: string; name: string }[] }[]) {
      if (subName) {
        for (const child of parent.children ?? []) {
          if (
            child.name.toLowerCase() === subName ||
            `${parent.name} ${child.name}`.toLowerCase().includes(subName)
          ) {
            matchedCategoryId = child.id;
            break;
          }
        }
      }
      if (!matchedCategoryId && catName && parent.name.toLowerCase() === catName) {
        matchedCategoryId = parent.id;
      }
      if (matchedCategoryId) break;
    }

    if ((catName || subName) && !matchedCategoryId) {
      warning = 'Suggested category was not found in your approved store categories';
    }

    return { matchedCategoryId, warning };
  }

  private async findOwnedAnalysis(
    merchantProfileId: string,
    storeId: string,
    analysisId: string,
  ) {
    const analysis = await this.prisma.aIProductAnalysis.findFirst({
      where: { id: analysisId, merchantProfileId, storeId },
    });
    if (!analysis) throw new NotFoundException('Analysis not found');
    return analysis;
  }

  private async assertStoreOwnership(
    merchantProfileId: string,
    storeId: string,
  ): Promise<void> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId, deletedAt: null },
    });
    if (!store) throw new ForbiddenException('Store not found or not owned by you');
  }

  private toMerchantView(
    analysis: {
      id: string;
      storeId: string;
      uploadedImageUrl: string;
      originalImageUrl?: string | null;
      optimizedImageUrl?: string | null;
      thumbnailImageUrl?: string | null;
      aiAnalysisImageUrl?: string | null;
      extractedJson: unknown;
      confidence: number | null;
      status: AIProductAnalysisStatus;
      errorMessage: string | null;
      createdProductId: string | null;
      chargeAmountPaise: number;
      chargedAt: Date | null;
      createdAt: Date;
      detectedProductType?: AIProductType | null;
    },
    categoryMatch?: unknown,
  ) {
    const extracted = (analysis.extractedJson ?? {}) as Record<string, unknown>;
    const { categoryMatch: _cm, ...fields } = extracted;
    const suggestions = (extracted.fields && typeof extracted.fields === 'object')
      ? extracted.fields
      : this.buildFieldSuggestions(fields as unknown as AiExtractedProduct, (categoryMatch ?? _cm) as { matchedCategoryId?: string | null; warning?: string | null } | undefined).fields;
    const missingFields = Array.isArray(extracted.missingFields)
      ? extracted.missingFields
      : this.findMissingFields(suggestions as AiProductFieldSuggestions);
    const warnings = Array.isArray(extracted.warnings)
      ? extracted.warnings
      : this.buildWarnings(fields as Record<string, unknown>, categoryMatch ?? _cm);

    const supplementBlocked =
      Boolean(fields.isSupplement) &&
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
      lowConfidence: (analysis.confidence ?? 0) < AI_LOW_CONFIDENCE_THRESHOLD,
      publishBlocked:
        (analysis.confidence ?? 0) < AI_LOW_CONFIDENCE_THRESHOLD ||
        supplementBlocked ||
        fields.productType === 'RESTAURANT_FOOD' ||
        analysis.detectedProductType === AIProductType.RESTAURANT_FOOD,
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

  private buildFieldSuggestions(
    extracted: Partial<AiExtractedProduct>,
    categoryMatch?: { matchedCategoryId?: string | null; warning?: string | null } | null,
  ): { fields: AiProductFieldSuggestions; missingFields: string[]; warnings: string[] } {
    const confidence = this.clamp01(extracted.confidence);
    const hasOcr = Boolean(extracted.ocrText?.trim());
    const ocrConfidence = hasOcr ? Math.max(confidence, 0.65) : confidence;
    const safeSku = this.buildSku(extracted.brand, extracted.name, extracted.barcode);
    const categoryId = categoryMatch?.matchedCategoryId ?? null;
    const hsnCode = this.normalizeHsnCode(extracted.hsnCode);
    const gstSlab = this.gstPercentToSlab(extracted.gstPercent);

    const fields: AiProductFieldSuggestions = {
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
      disclaimer: this.field(
        extracted.disclaimer || this.defaultDisclaimer(extracted),
        extracted.disclaimer ? ocrConfidence : 0.6,
        extracted.disclaimer ? 'ocr' : 'ai_inferred',
        true,
      ),
      returnAllowed: this.field(!extracted.isSupplement && extracted.productType !== 'RESTAURANT_FOOD', 0.55, 'default', true),
      refundAllowed: this.field(true, 0.55, 'default', true),
      replacementAllowed: this.field(true, 0.55, 'default', true),
      returnWindowHours: this.field(extracted.productType === 'FRESH_FOOD' ? 2 : 24, 0.5, 'default', true),
      proofRequired: this.field('PHOTO_OR_VIDEO', 0.5, 'default', true),
      approvalMode: this.field('MANUAL', 0.5, 'default', true),
      autoApproveBelow: this.field(null, 0, 'merchant_required', true),
      refundMethod: this.field('ORIGINAL_PAYMENT', 0.5, 'default', true),
      foodPolicy: this.field(extracted.productType === 'RESTAURANT_FOOD' ? 'REFUND_ONLY' : null, extracted.productType === 'RESTAURANT_FOOD' ? 0.5 : 0, extracted.productType === 'RESTAURANT_FOOD' ? 'default' : 'merchant_required', true),
      allowCustomerChangedMind: this.field(false, 0.6, 'default', true),
      eligibleReturnReasons: this.field(
        ['WRONG_ITEM', 'DAMAGED', 'MISSING_ITEM', 'QUALITY_ISSUE', 'EXPIRED_PRODUCT', 'PACKAGING_DAMAGED', 'NOT_AS_DESCRIBED', 'OTHER'],
        0.55,
        'default',
        true,
      ),
      returnPolicyText: this.field('AI suggested return rules. Merchant must verify category, shelf-life, and regulatory restrictions before saving.', 0.5, 'default', true),
      replacementPolicyText: this.field('Replacement is suggested only for wrong, damaged, missing, or not-as-described items after merchant review.', 0.5, 'default', true),
      priceInclusiveOfTax: this.field(true, 0.5, 'default', true),
    };

    return {
      fields,
      missingFields: this.findMissingFields(fields),
      warnings: this.buildWarnings(extracted as unknown as Record<string, unknown>, categoryMatch),
    };
  }

  private field<T>(
    value: T | null | undefined,
    confidence: number,
    source: AiFieldSource,
    requiresReview = source !== 'ocr',
  ): AiSuggestionField<T> {
    return {
      value: value === undefined ? null : value,
      confidence: this.clamp01(confidence),
      source,
      ...(requiresReview ? { requiresReview: true } : {}),
    };
  }

  private findMissingFields(fields: AiProductFieldSuggestions): string[] {
    return Object.entries(fields)
      .filter(([, field]) => field.source === 'merchant_required' || field.value === null || field.value === '')
      .map(([key]) => key);
  }

  private buildWarnings(extracted: Record<string, unknown>, categoryMatch?: unknown): string[] {
    const warnings: string[] = [];
    const match = categoryMatch as { warning?: string | null; matchedCategoryId?: string | null } | undefined;
    if (match?.warning) warnings.push(match.warning);
    if (!match?.matchedCategoryId) warnings.push('Category could not be confidently mapped to approved store categories.');
    if (!extracted.mrp && !extracted.sellingPrice) warnings.push('Price/MRP was not visible. Merchant must enter price before saving.');
    if (!extracted.hsnCode) warnings.push('HSN/GST was not visible. Merchant must verify tax details before saving.');
    if (extracted.isSupplement) warnings.push('Supplement/regulatory fields are sensitive. Verify ingredients, allergens, FSSAI, manufacturer, and label details.');
    return [...new Set(warnings)];
  }

  private defaultDescription(extracted: Partial<AiExtractedProduct>): string | null {
    const parts = [extracted.brand, extracted.name, extracted.weight || extracted.unit].filter(Boolean);
    return parts.length >= 2 ? parts.join(' ') : null;
  }

  private defaultDisclaimer(extracted: Partial<AiExtractedProduct>): string {
    return extracted.isSupplement
      ? 'AI suggested supplement details from the uploaded label. Merchant must verify ingredients, allergens, FSSAI/regulatory details, manufacturer information, pricing, and claims before saving.'
      : 'AI suggested product details from the uploaded image. Merchant must verify label, pricing, tax, manufacturer, and regulatory details before saving.';
  }

  private buildSku(brand?: string, name?: string, barcode?: string | null): string | null {
    if (barcode) return barcode.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 50) || null;
    const text = [brand, name].filter(Boolean).join(' ');
    const slug = text
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    return slug ? `${slug}-${Date.now().toString().slice(-6)}` : null;
  }

  private unitFromWeight(weight?: string): string | null {
    const value = weight?.trim().toLowerCase();
    if (!value) return null;
    if (/\b(kg|g|gram|grams)\b/.test(value)) return value;
    if (/\b(ml|l|litre|liter)\b/.test(value)) return value;
    return null;
  }

  private normalizeHsnCode(value?: string | null): string | null {
    const normalized = value?.replace(/[^\d]/g, '') ?? '';
    return /^\d{4}(\d{2}){0,2}$/.test(normalized) ? normalized : null;
  }

  private gstPercentToSlab(value?: number | null): string | null {
    if (value == null) return null;
    if (value === 0) return 'ZERO';
    if (value === 5) return 'FIVE';
    if (value === 12) return 'TWELVE';
    if (value === 18) return 'EIGHTEEN';
    if (value === 28) return 'TWENTY_EIGHT';
    return null;
  }

  private clamp01(value: unknown): number {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.min(1, Math.max(0, n));
  }

  private mapProductType(productType?: string, isSupplement?: boolean): AIProductType {
    if (isSupplement) return AIProductType.SUPPLEMENT;
    const map: Record<string, AIProductType> = {
      PACKAGED_PRODUCT: AIProductType.PACKAGED_PRODUCT,
      FRESH_FOOD: AIProductType.FRESH_FOOD,
      RESTAURANT_FOOD: AIProductType.RESTAURANT_FOOD,
      SUPPLEMENT: AIProductType.SUPPLEMENT,
      ELECTRONICS: AIProductType.ELECTRONICS,
      BEAUTY: AIProductType.BEAUTY,
      PET: AIProductType.PET,
      FLOWERS: AIProductType.FLOWERS,
    };
    return map[productType ?? ''] ?? AIProductType.UNKNOWN;
  }
}
