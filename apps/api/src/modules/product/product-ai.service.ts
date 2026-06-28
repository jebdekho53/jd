import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AIProductAnalysisStatus, MerchantAiWalletTransactionStatus, MerchantAiWalletTransactionType } from '@prisma/client';
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
import { CreateProductDto } from './dto/create-product.dto';
import {
  AI_LOW_CONFIDENCE_THRESHOLD,
  AI_NOT_CONFIGURED_CODE,
  AI_PRODUCT_UNAVAILABLE_MESSAGE,
} from './product-ai.constants';

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

      const updated = await this.prisma.aIProductAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: AIProductAnalysisStatus.COMPLETED,
          extractedJson: {
            ...extracted,
            categoryMatch,
          },
          confidence: extracted.confidence,
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
    },
    categoryMatch?: unknown,
  ) {
    const extracted = (analysis.extractedJson ?? {}) as Record<string, unknown>;
    const { categoryMatch: _cm, ...fields } = extracted;

    const supplementBlocked =
      Boolean(fields.isSupplement) &&
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
      lowConfidence: (analysis.confidence ?? 0) < AI_LOW_CONFIDENCE_THRESHOLD,
      publishBlocked:
        (analysis.confidence ?? 0) < AI_LOW_CONFIDENCE_THRESHOLD || supplementBlocked,
      supplementBlocked,
      supplementWarning: supplementBlocked
        ? 'Supplement label is not clear. Please upload a clearer front-label image or save as draft.'
        : null,
      missingPrice: fields.sellingPrice == null && fields.mrp == null,
      isSupplement: Boolean(fields.isSupplement),
      labelReadable: fields.labelReadable ?? null,
      canPublishDirectly: fields.canPublishDirectly !== false && !supplementBlocked,
      imageQualityScore: fields.imageQualityScore ?? null,
    };
  }
}
