import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MerchantAiWalletTransactionStatus,
  MerchantAiWalletTransactionType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RazorpayService } from '../payment/razorpay.service';

export const INSUFFICIENT_AI_WALLET_MESSAGE =
  'Insufficient AI wallet balance. Please recharge minimum ₹100 to continue.';

@Injectable()
export class MerchantAiWalletService {
  private readonly logger = new Logger(MerchantAiWalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly razorpay: RazorpayService,
    private readonly audit: AuditService,
  ) {}

  // Env vars come in as strings, so config.get returns a string whenever the
  // key is set (only the numeric default is used when unset). Coerce to an int
  // so these values are safe to use in Prisma increment/decrement (Int) ops.
  private getIntConfig(key: string, fallback: number): number {
    const raw = this.config.get<string | number>(key);
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
  }

  getMinRechargePaise(): number {
    return this.getIntConfig('AI_WALLET_MIN_RECHARGE_PAISE', 10_000);
  }

  getProductCostPaise(): number {
    return this.getIntConfig('AI_PRODUCT_ANALYSIS_PRICE_PAISE', 150);
  }

  getImageGenerationCostPaise(): number {
    // Only the AI edit (OpenAI vision) path is billable. Local background
    // removal (rembg) is free — see ProductAiService.generateProductImage.
    return this.getIntConfig('AI_IMAGE_GENERATION_PRICE_PAISE', 150);
  }

  buildDebitIdempotencyKey(merchantProfileId: string, storeId: string, analysisId: string): string {
    return `${merchantProfileId}:${storeId}:${analysisId}:AI_PRODUCT_CREATE`;
  }

  buildRefundIdempotencyKey(debitKey: string): string {
    return `${debitKey}:REFUND`;
  }

  async getOrCreateWallet(merchantProfileId: string) {
    return this.prisma.merchantAiWallet.upsert({
      where: { merchantProfileId },
      create: { merchantProfileId },
      update: {},
    });
  }

  async getWalletSummary(merchantProfileId: string, page = 1, limit = 50) {
    const wallet = await this.getOrCreateWallet(merchantProfileId);
    const [transactions, total] = await Promise.all([
      this.prisma.merchantAiWalletTransaction.findMany({
        where: { merchantProfileId },
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
      this.prisma.merchantAiWalletTransaction.count({ where: { merchantProfileId } }),
    ]);

    return {
      balancePaise: wallet.balancePaise,
      balanceRupee: wallet.balancePaise / 100,
      minimumRechargePaise: this.getMinRechargePaise(),
      minimumRechargeRupee: this.getMinRechargePaise() / 100,
      aiProductCostPaise: this.getProductCostPaise(),
      aiProductCostRupee: this.getProductCostPaise() / 100,
      totalSpentPaise: wallet.totalSpentPaise,
      totalRechargedPaise: wallet.totalRechargedPaise,
      totalRefundedPaise: wallet.totalRefundedPaise,
      transactions: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        status: tx.status,
        amountPaise: tx.amountPaise,
        amountRupee: tx.amountPaise / 100,
        balanceBeforePaise: tx.balanceBeforePaise,
        balanceAfterPaise: tx.balanceAfterPaise,
        reason: tx.reason,
        storeId: tx.storeId,
        analysisId: tx.analysisId,
        productName:
          tx.analysis?.createdProduct?.name ??
          ((tx.analysis?.extractedJson as Record<string, unknown> | null)?.name as string | undefined) ??
          null,
        createdAt: tx.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createRechargeOrder(merchantProfileId: string, amountPaise: number, userId: string, ip?: string) {
    const min = this.getMinRechargePaise();
    if (amountPaise < min) {
      throw new BadRequestException(`Minimum recharge is ₹${min / 100}`);
    }
    if (!this.razorpay.isConfigured()) {
      throw new BadRequestException('Online payments are not configured');
    }

    const wallet = await this.getOrCreateWallet(merchantProfileId);
    const receipt = `ai-wallet-${merchantProfileId.slice(-8)}-${Date.now()}`;
    const rzpOrder = await this.razorpay.createOrder(amountPaise / 100, receipt);
    const idempotencyKey = `recharge:${merchantProfileId}:${rzpOrder.id}`;

    const tx = await this.prisma.merchantAiWalletTransaction.create({
      data: {
        merchantProfileId,
        type: MerchantAiWalletTransactionType.RECHARGE,
        amountPaise,
        balanceBeforePaise: wallet.balancePaise,
        balanceAfterPaise: wallet.balancePaise,
        status: MerchantAiWalletTransactionStatus.PENDING,
        razorpayOrderId: rzpOrder.id,
        reason: 'AI wallet recharge',
        idempotencyKey,
      },
    });

    await this.audit.log({
      actorId: userId,
      action: 'AI_WALLET_RECHARGE_INITIATED',
      resourceType: 'merchant_ai_wallet_transaction',
      resourceId: tx.id,
      ipAddress: ip,
      metadata: { amountPaise, razorpayOrderId: rzpOrder.id } as Prisma.InputJsonValue,
    });

    return {
      transactionId: tx.id,
      razorpayOrderId: rzpOrder.id,
      keyId: this.razorpay.keyId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      amountPaise,
    };
  }

  async verifyRecharge(
    merchantProfileId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    userId: string,
    ip?: string,
  ) {
    if (!this.razorpay.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      throw new UnauthorizedException('Invalid payment signature');
    }

    const pending = await this.prisma.merchantAiWalletTransaction.findFirst({
      where: {
        merchantProfileId,
        razorpayOrderId,
        type: MerchantAiWalletTransactionType.RECHARGE,
      },
    });
    if (!pending) throw new BadRequestException('Recharge transaction not found');
    if (pending.status === MerchantAiWalletTransactionStatus.SUCCESS) {
      const wallet = await this.getOrCreateWallet(merchantProfileId);
      return {
        success: true,
        alreadyProcessed: true,
        balancePaise: wallet.balancePaise,
        transactionId: pending.id,
      };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.merchantAiWalletTransaction.findUnique({
        where: { id: pending.id },
      });
      if (!current || current.status === MerchantAiWalletTransactionStatus.SUCCESS) {
        const wallet = await tx.merchantAiWallet.findUnique({ where: { merchantProfileId } });
        return { wallet: wallet!, transactionId: current?.id ?? pending.id, credited: false };
      }

      const wallet = await tx.merchantAiWallet.upsert({
        where: { merchantProfileId },
        create: {
          merchantProfileId,
          balancePaise: current.amountPaise,
          totalRechargedPaise: current.amountPaise,
        },
        update: {
          balancePaise: { increment: current.amountPaise },
          totalRechargedPaise: { increment: current.amountPaise },
        },
      });

      await tx.merchantAiWalletTransaction.update({
        where: { id: current.id },
        data: {
          status: MerchantAiWalletTransactionStatus.SUCCESS,
          razorpayPaymentId,
          balanceBeforePaise: wallet.balancePaise - current.amountPaise,
          balanceAfterPaise: wallet.balancePaise,
        },
      });

      return { wallet, transactionId: current.id, credited: true };
    });

    if (result.credited) {
      await this.audit.log({
        actorId: userId,
        action: 'AI_WALLET_RECHARGED',
        resourceType: 'merchant_ai_wallet_transaction',
        resourceId: result.transactionId,
        ipAddress: ip,
        metadata: { amountPaise: pending.amountPaise, razorpayPaymentId } as Prisma.InputJsonValue,
      });
    }

    return {
      success: true,
      alreadyProcessed: !result.credited,
      balancePaise: result.wallet.balancePaise,
      transactionId: result.transactionId,
    };
  }

  async debitForProductCreation(
    merchantProfileId: string,
    storeId: string,
    analysisId: string,
    userId: string,
    ip?: string,
  ): Promise<{ charged: boolean; amountPaise: number; transactionId: string }> {
    const amountPaise = this.getProductCostPaise();
    const idempotencyKey = this.buildDebitIdempotencyKey(merchantProfileId, storeId, analysisId);

    const existing = await this.prisma.merchantAiWalletTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing?.status === MerchantAiWalletTransactionStatus.SUCCESS) {
      return { charged: false, amountPaise: existing.amountPaise, transactionId: existing.id };
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.merchantAiWallet.upsert({
          where: { merchantProfileId },
          create: { merchantProfileId },
          update: {},
        });

        if (wallet.balancePaise < amountPaise) {
          throw new HttpException(
            { message: INSUFFICIENT_AI_WALLET_MESSAGE, code: 'INSUFFICIENT_AI_WALLET' },
            HttpStatus.PAYMENT_REQUIRED,
          );
        }

        const updatedWallet = await tx.merchantAiWallet.update({
          where: { merchantProfileId },
          data: {
            balancePaise: { decrement: amountPaise },
            totalSpentPaise: { increment: amountPaise },
          },
        });

        if (updatedWallet.balancePaise < 0) {
          throw new HttpException(
            { message: INSUFFICIENT_AI_WALLET_MESSAGE, code: 'INSUFFICIENT_AI_WALLET' },
            HttpStatus.PAYMENT_REQUIRED,
          );
        }

        const walletTx = await tx.merchantAiWalletTransaction.create({
          data: {
            merchantProfileId,
            storeId,
            analysisId,
            type: MerchantAiWalletTransactionType.DEBIT,
            amountPaise,
            balanceBeforePaise: wallet.balancePaise,
            balanceAfterPaise: updatedWallet.balancePaise,
            status: MerchantAiWalletTransactionStatus.SUCCESS,
            reason: 'AI product creation confirmed',
            idempotencyKey,
          },
        });

        return walletTx;
      });

      await this.audit.log({
        actorId: userId,
        action: 'AI_WALLET_DEBIT',
        resourceType: 'merchant_ai_wallet_transaction',
        resourceId: result.id,
        ipAddress: ip,
        metadata: { analysisId, storeId, amountPaise } as Prisma.InputJsonValue,
      });

      return { charged: true, amountPaise, transactionId: result.id };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      const dup = await this.prisma.merchantAiWalletTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (dup) {
        return { charged: false, amountPaise: dup.amountPaise, transactionId: dup.id };
      }
      throw e;
    }
  }

  /**
   * Charge for an AI-assisted menu item, keyed by the menu AI job. Mirrors
   * debitForProductCreation, but menu jobs live in menu_ocr_jobs so the
   * analysisId FK column stays null.
   */
  async debitForMenuItemCreation(
    merchantProfileId: string,
    storeId: string,
    jobId: string,
    userId: string,
    ip?: string,
  ): Promise<{ charged: boolean; amountPaise: number; transactionId: string }> {
    const amountPaise = this.getProductCostPaise();
    const idempotencyKey = `${merchantProfileId}:${storeId}:${jobId}:AI_MENU_ITEM_CREATE`;

    const existing = await this.prisma.merchantAiWalletTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing?.status === MerchantAiWalletTransactionStatus.SUCCESS) {
      return { charged: false, amountPaise: existing.amountPaise, transactionId: existing.id };
    }

    const walletTx = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.merchantAiWallet.upsert({
        where: { merchantProfileId },
        create: { merchantProfileId },
        update: {},
      });

      if (wallet.balancePaise < amountPaise) {
        throw new HttpException(
          { message: INSUFFICIENT_AI_WALLET_MESSAGE, code: 'INSUFFICIENT_AI_WALLET' },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      const updatedWallet = await tx.merchantAiWallet.update({
        where: { merchantProfileId },
        data: {
          balancePaise: { decrement: amountPaise },
          totalSpentPaise: { increment: amountPaise },
        },
      });

      return tx.merchantAiWalletTransaction.create({
        data: {
          merchantProfileId,
          storeId,
          type: MerchantAiWalletTransactionType.DEBIT,
          amountPaise,
          balanceBeforePaise: wallet.balancePaise,
          balanceAfterPaise: updatedWallet.balancePaise,
          status: MerchantAiWalletTransactionStatus.SUCCESS,
          reason: 'AI menu item creation confirmed',
          idempotencyKey,
        },
      });
    });

    await this.audit.log({
      actorId: userId,
      action: 'AI_WALLET_DEBIT_MENU_ITEM',
      resourceType: 'merchant_ai_wallet_transaction',
      resourceId: walletTx.id,
      ipAddress: ip,
      metadata: { jobId, storeId, amountPaise } as Prisma.InputJsonValue,
    });

    return { charged: true, amountPaise, transactionId: walletTx.id };
  }

  /** Refund a menu-item charge when the item could not be created. */
  async refundMenuItemCreation(
    merchantProfileId: string,
    storeId: string,
    jobId: string,
    reason: string,
    userId?: string,
    ip?: string,
  ): Promise<void> {
    const debitKey = `${merchantProfileId}:${storeId}:${jobId}:AI_MENU_ITEM_CREATE`;
    const debit = await this.prisma.merchantAiWalletTransaction.findUnique({
      where: { idempotencyKey: debitKey },
    });
    if (!debit || debit.status !== MerchantAiWalletTransactionStatus.SUCCESS) return;

    const refundKey = this.buildRefundIdempotencyKey(debitKey);
    const already = await this.prisma.merchantAiWalletTransaction.findUnique({
      where: { idempotencyKey: refundKey },
    });
    if (already) return;

    const refundTx = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.merchantAiWallet.findUnique({ where: { merchantProfileId } });
      if (!wallet) return null;

      const updatedWallet = await tx.merchantAiWallet.update({
        where: { merchantProfileId },
        data: {
          balancePaise: { increment: debit.amountPaise },
          totalRefundedPaise: { increment: debit.amountPaise },
          totalSpentPaise: { decrement: debit.amountPaise },
        },
      });

      const created = await tx.merchantAiWalletTransaction.create({
        data: {
          merchantProfileId,
          storeId,
          type: MerchantAiWalletTransactionType.REFUND,
          amountPaise: debit.amountPaise,
          balanceBeforePaise: wallet.balancePaise,
          balanceAfterPaise: updatedWallet.balancePaise,
          status: MerchantAiWalletTransactionStatus.REFUNDED,
          reason,
          idempotencyKey: refundKey,
        },
      });

      await tx.merchantAiWalletTransaction.update({
        where: { id: debit.id },
        data: { status: MerchantAiWalletTransactionStatus.REFUNDED },
      });

      return created;
    });
    if (!refundTx) return;

    await this.audit.log({
      actorId: userId ?? 'system',
      action: 'AI_WALLET_REFUND_MENU_ITEM',
      resourceType: 'merchant_ai_wallet_transaction',
      resourceId: refundTx.id,
      ipAddress: ip,
      metadata: { jobId, storeId, reason } as Prisma.InputJsonValue,
    });
  }

  /** Idempotency key for the single image-generation fee per analysis. */
  private imageGenIdempotencyKey(merchantProfileId: string, storeId: string, analysisId: string): string {
    return `${merchantProfileId}:${storeId}:${analysisId}:AI_IMAGE_GEN`;
  }

  /**
   * Whether the one-time image-generation fee has already been charged for this
   * analysis. Used to let the merchant generate their allotted images (local or
   * AI) after the single upfront charge without being billed again.
   */
  async hasImageGenerationCharge(merchantProfileId: string, storeId: string, analysisId: string): Promise<boolean> {
    const existing = await this.prisma.merchantAiWalletTransaction.findUnique({
      where: { idempotencyKey: this.imageGenIdempotencyKey(merchantProfileId, storeId, analysisId) },
      select: { status: true },
    });
    return existing?.status === MerchantAiWalletTransactionStatus.SUCCESS;
  }

  /**
   * Charge the one-time image-generation fee for an analysis. The fee is keyed
   * by analysis, so the first generation is billed and every subsequent
   * generation for the same product (up to the per-analysis cap enforced by the
   * caller) is free — local background removal and AI edits alike.
   */
  async debitForImageGeneration(
    merchantProfileId: string,
    storeId: string,
    analysisId: string,
    userId: string,
    ip?: string,
  ): Promise<{ charged: boolean; amountPaise: number; transactionId: string; balancePaise: number }> {
    const amountPaise = this.getImageGenerationCostPaise();
    const idempotencyKey = this.imageGenIdempotencyKey(merchantProfileId, storeId, analysisId);

    const existing = await this.prisma.merchantAiWalletTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing?.status === MerchantAiWalletTransactionStatus.SUCCESS) {
      // Already paid for this analysis — subsequent generations are free.
      // Report the live balance so the UI stays accurate.
      const wallet = await this.getOrCreateWallet(merchantProfileId);
      return {
        charged: false,
        amountPaise: 0,
        transactionId: existing.id,
        balancePaise: wallet.balancePaise,
      };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.merchantAiWallet.upsert({
        where: { merchantProfileId },
        create: { merchantProfileId },
        update: {},
      });

      if (wallet.balancePaise < amountPaise) {
        throw new HttpException(
          { message: INSUFFICIENT_AI_WALLET_MESSAGE, code: 'INSUFFICIENT_AI_WALLET' },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      const updatedWallet = await tx.merchantAiWallet.update({
        where: { merchantProfileId },
        data: {
          balancePaise: { decrement: amountPaise },
          totalSpentPaise: { increment: amountPaise },
        },
      });

      const walletTx = await tx.merchantAiWalletTransaction.create({
        data: {
          merchantProfileId,
          storeId,
          analysisId,
          type: MerchantAiWalletTransactionType.DEBIT,
          amountPaise,
          balanceBeforePaise: wallet.balancePaise,
          balanceAfterPaise: updatedWallet.balancePaise,
          status: MerchantAiWalletTransactionStatus.SUCCESS,
          reason: 'AI product image generation',
          idempotencyKey,
        },
      });

      return { walletTx, balancePaise: updatedWallet.balancePaise };
    });

    await this.audit.log({
      actorId: userId,
      action: 'AI_WALLET_DEBIT_IMAGE_GEN',
      resourceType: 'merchant_ai_wallet_transaction',
      resourceId: result.walletTx.id,
      ipAddress: ip,
      metadata: { analysisId, storeId, amountPaise } as Prisma.InputJsonValue,
    });

    return {
      charged: true,
      amountPaise,
      transactionId: result.walletTx.id,
      balancePaise: result.balancePaise,
    };
  }

  async refundOnProductCreationFailure(
    merchantProfileId: string,
    storeId: string,
    analysisId: string,
    reason: string,
    userId?: string,
    ip?: string,
  ): Promise<void> {
    const debitKey = this.buildDebitIdempotencyKey(merchantProfileId, storeId, analysisId);
    const debit = await this.prisma.merchantAiWalletTransaction.findUnique({
      where: { idempotencyKey: debitKey },
    });
    if (!debit || debit.status !== MerchantAiWalletTransactionStatus.SUCCESS) return;

    const refundKey = this.buildRefundIdempotencyKey(debitKey);
    const existingRefund = await this.prisma.merchantAiWalletTransaction.findUnique({
      where: { idempotencyKey: refundKey },
    });
    if (existingRefund) return;

    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.merchantAiWallet.findUnique({ where: { merchantProfileId } });
      if (!wallet) return;

      const updatedWallet = await tx.merchantAiWallet.update({
        where: { merchantProfileId },
        data: {
          balancePaise: { increment: debit.amountPaise },
          totalRefundedPaise: { increment: debit.amountPaise },
          totalSpentPaise: { decrement: debit.amountPaise },
        },
      });

      await tx.merchantAiWalletTransaction.create({
        data: {
          merchantProfileId,
          storeId,
          analysisId,
          type: MerchantAiWalletTransactionType.REFUND,
          amountPaise: debit.amountPaise,
          balanceBeforePaise: wallet.balancePaise,
          balanceAfterPaise: updatedWallet.balancePaise,
          status: MerchantAiWalletTransactionStatus.REFUNDED,
          reason,
          idempotencyKey: refundKey,
        },
      });

      await tx.merchantAiWalletTransaction.update({
        where: { id: debit.id },
        data: { status: MerchantAiWalletTransactionStatus.REFUNDED },
      });
    });

    if (analysisId) {
      await this.prisma.aIProductAnalysis.updateMany({
        where: { id: analysisId },
        data: { chargedAt: null },
      });
    }

    if (userId) {
      await this.audit.log({
        actorId: userId,
        action: 'AI_WALLET_REFUND',
        resourceType: 'merchant_ai_wallet_transaction',
        resourceId: debit.id,
        ipAddress: ip,
        metadata: { analysisId, reason, amountPaise: debit.amountPaise } as Prisma.InputJsonValue,
      });
    }
  }

  async adminAdjust(
    merchantProfileId: string,
    amountPaise: number,
    reason: string,
    adminUserId: string,
    ip?: string,
  ) {
    if (amountPaise === 0) throw new BadRequestException('Adjustment amount cannot be zero');

    const idempotencyKey = `adjust:${merchantProfileId}:${Date.now()}:${amountPaise}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.merchantAiWallet.upsert({
        where: { merchantProfileId },
        create: { merchantProfileId, balancePaise: Math.max(0, amountPaise) },
        update:
          amountPaise > 0
            ? { balancePaise: { increment: amountPaise } }
            : { balancePaise: { decrement: Math.abs(amountPaise) } },
      });

      if (wallet.balancePaise < 0) {
        throw new BadRequestException('Adjustment would result in negative balance');
      }

      const walletTx = await tx.merchantAiWalletTransaction.create({
        data: {
          merchantProfileId,
          type: MerchantAiWalletTransactionType.ADJUSTMENT,
          amountPaise: Math.abs(amountPaise),
          balanceBeforePaise:
            amountPaise > 0 ? wallet.balancePaise - amountPaise : wallet.balancePaise + Math.abs(amountPaise),
          balanceAfterPaise: wallet.balancePaise,
          status: MerchantAiWalletTransactionStatus.SUCCESS,
          reason,
          idempotencyKey,
        },
      });

      return { wallet, walletTx };
    });

    await this.audit.log({
      actorId: adminUserId,
      action: 'AI_WALLET_ADMIN_ADJUST',
      resourceType: 'merchant_ai_wallet',
      resourceId: merchantProfileId,
      ipAddress: ip,
      metadata: { amountPaise, reason } as Prisma.InputJsonValue,
    });

    return {
      balancePaise: result.wallet.balancePaise,
      transactionId: result.walletTx.id,
    };
  }

  async listWalletsForAdmin(page = 1, limit = 50) {
    const [items, total] = await Promise.all([
      this.prisma.merchantAiWallet.findMany({
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          merchantProfile: {
            select: {
              id: true,
              businessName: true,
              user: { select: { email: true, phone: true } },
            },
          },
        },
      }),
      this.prisma.merchantAiWallet.count(),
    ]);

    return {
      items: items.map((w) => ({
        merchantProfileId: w.merchantProfileId,
        businessName: w.merchantProfile.businessName,
        email: w.merchantProfile.user?.email,
        phone: w.merchantProfile.user?.phone,
        balancePaise: w.balancePaise,
        totalRechargedPaise: w.totalRechargedPaise,
        totalSpentPaise: w.totalSpentPaise,
        totalRefundedPaise: w.totalRefundedPaise,
        updatedAt: w.updatedAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getWalletForAdmin(merchantProfileId: string) {
    const wallet = await this.getOrCreateWallet(merchantProfileId);
    const transactions = await this.prisma.merchantAiWalletTransaction.findMany({
      where: { merchantProfileId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantProfileId },
      select: { businessName: true, user: { select: { email: true, phone: true } } },
    });

    return {
      merchantProfileId,
      businessName: profile?.businessName,
      email: profile?.user?.email,
      phone: profile?.user?.phone,
      balancePaise: wallet.balancePaise,
      totalRechargedPaise: wallet.totalRechargedPaise,
      totalSpentPaise: wallet.totalSpentPaise,
      totalRefundedPaise: wallet.totalRefundedPaise,
      transactions,
    };
  }

  async getWalletStatsForAdmin() {
    const [rechargeAgg, debitAgg, refundAgg, outstanding] = await Promise.all([
      this.prisma.merchantAiWalletTransaction.aggregate({
        where: { type: MerchantAiWalletTransactionType.RECHARGE, status: MerchantAiWalletTransactionStatus.SUCCESS },
        _sum: { amountPaise: true },
        _count: true,
      }),
      this.prisma.merchantAiWalletTransaction.aggregate({
        where: { type: MerchantAiWalletTransactionType.DEBIT, status: MerchantAiWalletTransactionStatus.SUCCESS },
        _sum: { amountPaise: true },
        _count: true,
      }),
      this.prisma.merchantAiWalletTransaction.aggregate({
        where: { type: MerchantAiWalletTransactionType.REFUND, status: MerchantAiWalletTransactionStatus.REFUNDED },
        _sum: { amountPaise: true },
        _count: true,
      }),
      this.prisma.merchantAiWallet.aggregate({ _sum: { balancePaise: true }, _count: true }),
    ]);

    const topMerchants = await this.prisma.merchantAiWalletTransaction.groupBy({
      by: ['merchantProfileId'],
      where: { type: MerchantAiWalletTransactionType.DEBIT, status: MerchantAiWalletTransactionStatus.SUCCESS },
      _sum: { amountPaise: true },
      _count: true,
      orderBy: { _sum: { amountPaise: 'desc' } },
      take: 10,
    });

    return {
      totalRechargesPaise: rechargeAgg._sum.amountPaise ?? 0,
      totalRechargeCount: rechargeAgg._count,
      totalAiSpendPaise: debitAgg._sum.amountPaise ?? 0,
      totalDebitCount: debitAgg._count,
      totalRefundsPaise: refundAgg._sum.amountPaise ?? 0,
      totalRefundCount: refundAgg._count,
      outstandingBalancePaise: outstanding._sum.balancePaise ?? 0,
      merchantsWithBalance: outstanding._count,
      topMerchantsBySpend: topMerchants,
    };
  }
}
