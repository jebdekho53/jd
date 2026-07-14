import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  MerchantAiWalletTransactionStatus,
  MerchantAiWalletTransactionType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AiCatalogConfigService } from './ai-catalog-config.service';
import { ImageOutputType } from '../ai-catalog.constants';

/**
 * Per-output image billing on the shared merchant AI wallet. Every debit is
 * idempotency-keyed by imageAssetId so a worker retry can NEVER double-charge.
 * Refunds are issued only when a fully-paid generation irrecoverably fails, and
 * are themselves idempotent. Cache hits are free (no provider call was made).
 */
@Injectable()
export class AiCatalogBillingService {
  private readonly logger = new Logger(AiCatalogBillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: AiCatalogConfigService,
  ) {}

  private debitKey(imageAssetId: string): string {
    return `ai-catalog:img-debit:${imageAssetId}`;
  }
  private refundKey(imageAssetId: string): string {
    return `ai-catalog:img-refund:${imageAssetId}`;
  }

  async getBalancePaise(merchantProfileId: string): Promise<number> {
    const wallet = await this.prisma.merchantAiWallet.upsert({
      where: { merchantProfileId },
      create: { merchantProfileId },
      update: {},
    });
    return wallet.balancePaise;
  }

  /** Cost preview for a set of requested outputs (cache-hit outputs are free). */
  async estimate(
    outputTypes: ImageOutputType[],
    cacheHitOutputs: Set<ImageOutputType> = new Set(),
  ): Promise<{ lines: { outputType: string; amountPaise: number; cached: boolean }[]; totalPaise: number }> {
    const lines = [];
    let total = 0;
    for (const outputType of outputTypes) {
      const cached = cacheHitOutputs.has(outputType);
      const amountPaise = cached ? 0 : await this.config.priceForOutput(outputType);
      total += amountPaise;
      lines.push({ outputType, amountPaise, cached });
    }
    return { lines, totalPaise: total };
  }

  async assertSufficientBalance(merchantProfileId: string, requiredPaise: number): Promise<void> {
    if (requiredPaise <= 0) return;
    const balance = await this.getBalancePaise(merchantProfileId);
    if (balance < requiredPaise) {
      throw new HttpException(
        { message: 'Insufficient AI wallet balance. Please recharge.', code: 'INSUFFICIENT_AI_WALLET' },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  /**
   * Charge for one generated output. Idempotent by imageAssetId: a retry of the
   * same asset returns charged:false at ₹0. Call this only AFTER a successful,
   * non-cached provider render.
   */
  async debitForImage(params: {
    merchantProfileId: string;
    storeId: string;
    analysisId: string;
    imageAssetId: string;
    outputType: ImageOutputType;
    userId: string;
    ipAddress?: string;
  }): Promise<{ charged: boolean; amountPaise: number; balancePaise: number }> {
    const idempotencyKey = this.debitKey(params.imageAssetId);
    const existing = await this.prisma.merchantAiWalletTransaction.findUnique({ where: { idempotencyKey } });
    if (existing?.status === MerchantAiWalletTransactionStatus.SUCCESS) {
      const balance = await this.getBalancePaise(params.merchantProfileId);
      return { charged: false, amountPaise: 0, balancePaise: balance };
    }

    const amountPaise = await this.config.priceForOutput(params.outputType);
    if (amountPaise <= 0) {
      return { charged: false, amountPaise: 0, balancePaise: await this.getBalancePaise(params.merchantProfileId) };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.merchantAiWallet.upsert({
        where: { merchantProfileId: params.merchantProfileId },
        create: { merchantProfileId: params.merchantProfileId },
        update: {},
      });
      if (wallet.balancePaise < amountPaise) {
        throw new HttpException(
          { message: 'Insufficient AI wallet balance.', code: 'INSUFFICIENT_AI_WALLET' },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      const updated = await tx.merchantAiWallet.update({
        where: { merchantProfileId: params.merchantProfileId },
        data: { balancePaise: { decrement: amountPaise }, totalSpentPaise: { increment: amountPaise } },
      });
      const walletTx = await tx.merchantAiWalletTransaction.create({
        data: {
          merchantProfileId: params.merchantProfileId,
          storeId: params.storeId,
          analysisId: params.analysisId,
          type: MerchantAiWalletTransactionType.DEBIT,
          amountPaise,
          balanceBeforePaise: wallet.balancePaise,
          balanceAfterPaise: updated.balancePaise,
          status: MerchantAiWalletTransactionStatus.SUCCESS,
          reason: `AI image: ${params.outputType}`,
          idempotencyKey,
        },
      });
      return { walletTx, balancePaise: updated.balancePaise };
    });

    await this.audit.log({
      actorId: params.userId,
      action: 'AI_CATALOG_IMAGE_DEBIT',
      resourceType: 'merchant_ai_wallet_transaction',
      resourceId: result.walletTx.id,
      ipAddress: params.ipAddress,
      metadata: { imageAssetId: params.imageAssetId, outputType: params.outputType, amountPaise } as Prisma.InputJsonValue,
    });

    return { charged: true, amountPaise, balancePaise: result.balancePaise };
  }

  /**
   * Charge the analysis/product-creation fee once, idempotently by analysisId.
   * Called on merchant confirm (product creation), mirroring v1 billing where
   * the analysis preview is free and the charge lands at creation time.
   */
  async debitForConfirm(params: {
    merchantProfileId: string;
    storeId: string;
    analysisId: string;
    userId: string;
    ipAddress?: string;
  }): Promise<{ charged: boolean; amountPaise: number; balancePaise: number }> {
    const idempotencyKey = `ai-catalog:confirm-debit:${params.analysisId}`;
    const existing = await this.prisma.merchantAiWalletTransaction.findUnique({ where: { idempotencyKey } });
    if (existing?.status === MerchantAiWalletTransactionStatus.SUCCESS) {
      return { charged: false, amountPaise: 0, balancePaise: await this.getBalancePaise(params.merchantProfileId) };
    }
    const amountPaise = (await this.config.pricing()).analysisPaise;
    if (amountPaise <= 0) return { charged: false, amountPaise: 0, balancePaise: await this.getBalancePaise(params.merchantProfileId) };

    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.merchantAiWallet.upsert({
        where: { merchantProfileId: params.merchantProfileId },
        create: { merchantProfileId: params.merchantProfileId },
        update: {},
      });
      if (wallet.balancePaise < amountPaise) {
        throw new HttpException(
          { message: 'Insufficient AI wallet balance.', code: 'INSUFFICIENT_AI_WALLET' },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      const updated = await tx.merchantAiWallet.update({
        where: { merchantProfileId: params.merchantProfileId },
        data: { balancePaise: { decrement: amountPaise }, totalSpentPaise: { increment: amountPaise } },
      });
      const walletTx = await tx.merchantAiWalletTransaction.create({
        data: {
          merchantProfileId: params.merchantProfileId,
          storeId: params.storeId,
          analysisId: params.analysisId,
          type: MerchantAiWalletTransactionType.DEBIT,
          amountPaise,
          balanceBeforePaise: wallet.balancePaise,
          balanceAfterPaise: updated.balancePaise,
          status: MerchantAiWalletTransactionStatus.SUCCESS,
          reason: 'AI catalog product creation',
          idempotencyKey,
        },
      });
      return { walletTx, balancePaise: updated.balancePaise };
    });

    await this.audit.log({
      actorId: params.userId,
      action: 'AI_CATALOG_CONFIRM_DEBIT',
      resourceType: 'merchant_ai_wallet_transaction',
      resourceId: result.walletTx.id,
      ipAddress: params.ipAddress,
      metadata: { analysisId: params.analysisId, amountPaise } as Prisma.InputJsonValue,
    });
    return { charged: true, amountPaise, balancePaise: result.balancePaise };
  }

  /** Compensating refund for a failed confirm (product creation rolled back). */
  async refundConfirm(params: { merchantProfileId: string; analysisId: string; reason: string; userId: string }): Promise<void> {
    const debit = await this.prisma.merchantAiWalletTransaction.findUnique({
      where: { idempotencyKey: `ai-catalog:confirm-debit:${params.analysisId}` },
    });
    if (!debit || debit.status !== MerchantAiWalletTransactionStatus.SUCCESS) return;
    const refundKey = `ai-catalog:confirm-refund:${params.analysisId}`;
    if (await this.prisma.merchantAiWalletTransaction.findUnique({ where: { idempotencyKey: refundKey } })) return;
    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.merchantAiWallet.findUnique({ where: { merchantProfileId: params.merchantProfileId } });
      if (!wallet) return;
      const updated = await tx.merchantAiWallet.update({
        where: { merchantProfileId: params.merchantProfileId },
        data: {
          balancePaise: { increment: debit.amountPaise },
          totalRefundedPaise: { increment: debit.amountPaise },
          totalSpentPaise: { decrement: debit.amountPaise },
        },
      });
      await tx.merchantAiWalletTransaction.create({
        data: {
          merchantProfileId: params.merchantProfileId,
          storeId: debit.storeId,
          analysisId: params.analysisId,
          type: MerchantAiWalletTransactionType.REFUND,
          amountPaise: debit.amountPaise,
          balanceBeforePaise: wallet.balancePaise,
          balanceAfterPaise: updated.balancePaise,
          status: MerchantAiWalletTransactionStatus.REFUNDED,
          reason: `Confirm refund (${params.reason})`,
          idempotencyKey: refundKey,
        },
      });
    });
  }

  /** Refund a completed debit when its paid generation irrecoverably failed. */
  async refundForImage(params: {
    merchantProfileId: string;
    imageAssetId: string;
    reason: string;
    userId?: string;
    ipAddress?: string;
  }): Promise<void> {
    const debit = await this.prisma.merchantAiWalletTransaction.findUnique({
      where: { idempotencyKey: this.debitKey(params.imageAssetId) },
    });
    if (!debit || debit.status !== MerchantAiWalletTransactionStatus.SUCCESS) return;

    const refundKey = this.refundKey(params.imageAssetId);
    const existingRefund = await this.prisma.merchantAiWalletTransaction.findUnique({ where: { idempotencyKey: refundKey } });
    if (existingRefund) return;

    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.merchantAiWallet.findUnique({ where: { merchantProfileId: params.merchantProfileId } });
      if (!wallet) return;
      const updated = await tx.merchantAiWallet.update({
        where: { merchantProfileId: params.merchantProfileId },
        data: {
          balancePaise: { increment: debit.amountPaise },
          totalRefundedPaise: { increment: debit.amountPaise },
          totalSpentPaise: { decrement: debit.amountPaise },
        },
      });
      await tx.merchantAiWalletTransaction.create({
        data: {
          merchantProfileId: params.merchantProfileId,
          storeId: debit.storeId,
          analysisId: debit.analysisId,
          type: MerchantAiWalletTransactionType.REFUND,
          amountPaise: debit.amountPaise,
          balanceBeforePaise: wallet.balancePaise,
          balanceAfterPaise: updated.balancePaise,
          status: MerchantAiWalletTransactionStatus.REFUNDED,
          reason: `Refund (${params.reason})`,
          idempotencyKey: refundKey,
        },
      });
    });

    await this.audit.log({
      actorId: params.userId ?? 'system',
      action: 'AI_CATALOG_IMAGE_REFUND',
      resourceType: 'merchant_ai_wallet',
      resourceId: params.merchantProfileId,
      ipAddress: params.ipAddress,
      metadata: { imageAssetId: params.imageAssetId, amountPaise: debit.amountPaise, reason: params.reason } as Prisma.InputJsonValue,
    });
  }
}
