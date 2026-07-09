import { envInt } from '../../config/env-int.util';
import {
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { MerchantAiWalletService } from './merchant-ai-wallet.service';

@Injectable()
export class MerchantAiBillingService {
  private readonly logger = new Logger(MerchantAiBillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly wallet: MerchantAiWalletService,
  ) {}

  getPricePaise(): number {
    return this.wallet.getProductCostPaise();
  }

  getMinRechargePaise(): number {
    return this.wallet.getMinRechargePaise();
  }

  buildCreateProductIdempotencyKey(
    merchantProfileId: string,
    storeId: string,
    analysisId: string,
  ): string {
    return this.wallet.buildDebitIdempotencyKey(merchantProfileId, storeId, analysisId);
  }

  async chargeForProductCreation(
    merchantProfileId: string,
    storeId: string,
    analysisId: string,
    userId: string,
    ipAddress?: string,
  ): Promise<{ charged: boolean; amountPaise: number; transactionId: string }> {
    return this.wallet.debitForProductCreation(
      merchantProfileId,
      storeId,
      analysisId,
      userId,
      ipAddress,
    );
  }

  async refundOnProductCreationFailure(
    merchantProfileId: string,
    storeId: string,
    analysisId: string,
    reason: string,
    userId?: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.wallet.refundOnProductCreationFailure(
      merchantProfileId,
      storeId,
      analysisId,
      reason,
      userId,
      ipAddress,
    );
  }

  async assertDailyAnalysisLimit(merchantProfileId: string): Promise<void> {
    const limit = envInt(this.configService, 'AI_PRODUCT_ANALYSIS_DAILY_LIMIT', 20);
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
