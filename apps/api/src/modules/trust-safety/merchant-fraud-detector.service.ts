import { Injectable } from '@nestjs/common';
import { FraudCaseCategory, FraudDecisionAction, TrustAlertType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FraudActionService } from './fraud-action.service';
import { FraudCaseService } from './fraud-case.service';
import { RiskEngineService } from './risk-engine.service';
import { TrustAlertService } from './trust-alert.service';

@Injectable()
export class MerchantFraudDetectorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly risk: RiskEngineService,
    private readonly cases: FraudCaseService,
    private readonly actions: FraudActionService,
    private readonly alerts: TrustAlertService,
  ) {}

  async evaluateOrderPattern(storeId: string, merchantUserId: string) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [orders, reviews] = await Promise.all([
      this.prisma.order.count({ where: { storeId, createdAt: { gte: dayAgo } } }),
      this.prisma.review.count({
        where: { storeId, createdAt: { gte: dayAgo }, rating: 5 },
      }),
    ]);

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { createdAt: true },
    });
    const storeAgeDays = store
      ? (Date.now() - store.createdAt.getTime()) / (24 * 60 * 60 * 1000)
      : 999;

    if (storeAgeDays < 7 && orders > 100) {
      await this.flag(merchantUserId, storeId, 'MERCHANT_ORDER_INFLATION', `${orders} orders in 7 days`);
    }

    if (reviews > 20 && orders < 10) {
      await this.flag(merchantUserId, storeId, 'REVIEW_FARM', `${reviews} 5-star reviews vs ${orders} orders`);
    }
  }

  private async flag(userId: string, storeId: string, rule: string, detail: string) {
    const key = `merchant:${rule}:${storeId}`;
    await this.risk.recordEvent({
      userId,
      eventType: rule,
      severity: 'HIGH',
      idempotencyKey: key,
      metadata: { storeId, detail },
    });
    const fraudCase = await this.cases.openCase({
      userId,
      category: FraudCaseCategory.MERCHANT_FRAUD,
      severity: 'HIGH',
      title: 'Merchant fraud signal',
      description: `${rule}: ${detail}`,
      subjectType: 'store',
      subjectId: storeId,
      idempotencyKey: key,
    });
    await this.actions.apply(userId, FraudDecisionAction.MERCHANT_SUSPEND, rule, undefined, `${key}:action`);
    await this.alerts.raise(
      TrustAlertType.MERCHANT_ANOMALY,
      'HIGH',
      'Merchant fraud detected',
      fraudCase.description,
      { caseId: fraudCase.id },
    );
  }
}
