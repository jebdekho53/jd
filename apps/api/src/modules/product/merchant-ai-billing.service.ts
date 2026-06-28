import {
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MerchantAiCreditTransactionStatus,
  MerchantAiCreditTransactionType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MerchantAiBillingService {
  private readonly logger = new Logger(MerchantAiBillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  getPricePaise(): number {
    return this.configService.get<number>('AI_PRODUCT_ANALYSIS_PRICE_PAISE', 150);
  }

  buildCreateProductIdempotencyKey(
    merchantProfileId: string,
    storeId: string,
    analysisId: string,
  ): string {
    return `${merchantProfileId}:${storeId}:${analysisId}:CREATE_PRODUCT`;
  }

  buildRefundIdempotencyKey(debitIdempotencyKey: string): string {
    return `${debitIdempotencyKey}:REFUND`;
  }

  async chargeForProductCreation(
    merchantProfileId: string,
    storeId: string,
    analysisId: string,
  ): Promise<{ charged: boolean; amountPaise: number; transactionId: string }> {
    const amountPaise = this.getPricePaise();
    const idempotencyKey = this.buildCreateProductIdempotencyKey(
      merchantProfileId,
      storeId,
      analysisId,
    );

    const existing = await this.prisma.merchantAiCreditTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      if (existing.status === MerchantAiCreditTransactionStatus.SUCCESS) {
        return { charged: false, amountPaise: existing.amountPaise, transactionId: existing.id };
      }
      if (existing.status === MerchantAiCreditTransactionStatus.PENDING) {
        const updated = await this.prisma.merchantAiCreditTransaction.update({
          where: { id: existing.id },
          data: { status: MerchantAiCreditTransactionStatus.SUCCESS },
        });
        return { charged: true, amountPaise: updated.amountPaise, transactionId: updated.id };
      }
    }

    try {
      const tx = await this.prisma.merchantAiCreditTransaction.create({
        data: {
          merchantProfileId,
          storeId,
          analysisId,
          amountPaise,
          type: MerchantAiCreditTransactionType.DEBIT,
          status: MerchantAiCreditTransactionStatus.SUCCESS,
          reason: 'AI product creation confirmed',
          idempotencyKey,
        },
      });
      return { charged: true, amountPaise, transactionId: tx.id };
    } catch (e) {
      const dup = await this.prisma.merchantAiCreditTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (dup) {
        return { charged: false, amountPaise: dup.amountPaise, transactionId: dup.id };
      }
      throw e;
    }
  }

  async refundOnProductCreationFailure(
    merchantProfileId: string,
    storeId: string,
    analysisId: string,
    reason: string,
  ): Promise<void> {
    const debitKey = this.buildCreateProductIdempotencyKey(
      merchantProfileId,
      storeId,
      analysisId,
    );
    const debit = await this.prisma.merchantAiCreditTransaction.findUnique({
      where: { idempotencyKey: debitKey },
    });
    if (!debit || debit.status !== MerchantAiCreditTransactionStatus.SUCCESS) return;

    const refundKey = this.buildRefundIdempotencyKey(debitKey);
    const existingRefund = await this.prisma.merchantAiCreditTransaction.findUnique({
      where: { idempotencyKey: refundKey },
    });
    if (existingRefund) return;

    await this.prisma.merchantAiCreditTransaction.create({
      data: {
        merchantProfileId,
        storeId,
        analysisId,
        amountPaise: debit.amountPaise,
        type: MerchantAiCreditTransactionType.REFUND,
        status: MerchantAiCreditTransactionStatus.REFUNDED,
        reason,
        idempotencyKey: refundKey,
      },
    });

    await this.prisma.merchantAiCreditTransaction.update({
      where: { id: debit.id },
      data: { status: MerchantAiCreditTransactionStatus.REFUNDED },
    });

    if (analysisId) {
      await this.prisma.aIProductAnalysis.updateMany({
        where: { id: analysisId },
        data: { chargedAt: null },
      });
    }
  }

  async assertDailyAnalysisLimit(merchantProfileId: string): Promise<void> {
    const limit = this.configService.get<number>('AI_PRODUCT_ANALYSIS_DAILY_LIMIT', 20);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await this.prisma.aIProductAnalysis.count({
      where: {
        merchantProfileId,
        createdAt: { gte: startOfDay },
        status: { notIn: ['CANCELLED'] },
      },
    });

    if (count >= limit) {
      throw new ConflictException(
        `Daily AI analysis limit reached (${limit} per day). Try again tomorrow.`,
      );
    }
  }
}
