import { Injectable } from '@nestjs/common';
import { FraudCaseCategory, FraudDecisionAction, OrderStatus, PaymentMethod, TrustAlertType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FraudActionService } from './fraud-action.service';
import { FraudCaseService } from './fraud-case.service';
import { RiskEngineService } from './risk-engine.service';
import { TrustAlertService } from './trust-alert.service';

@Injectable()
export class CodFraudDetectorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly risk: RiskEngineService,
    private readonly cases: FraudCaseService,
    private readonly actions: FraudActionService,
    private readonly alerts: TrustAlertService,
  ) {}

  async evaluateCodCheckout(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const allowed = await this.risk.canUseCod(userId);
    if (!allowed) {
      return { allowed: false, reason: 'COD is not available for your account. Please use online payment.' };
    }
    return { allowed: true };
  }

  async updateBuyerCodMetrics(userId: string) {
    const buyer = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!buyer) return;

    const codOrders = await this.prisma.order.findMany({
      where: {
        buyerProfileId: buyer.id,
        paymentMethod: { in: [PaymentMethod.COD, PaymentMethod.WALLET_COD] },
      },
      select: { status: true },
    });
    if (codOrders.length < 3) return;

    const total = codOrders.length;
    const cancelled = codOrders.filter((o) =>
      ['CANCELLED_BY_BUYER', 'CANCELLED_BY_MERCHANT', 'CANCELLED_BY_ADMIN'].includes(o.status),
    ).length;
    const refused = codOrders.filter((o) => o.status === OrderStatus.REFUNDED).length;
    const delivered = codOrders.filter((o) =>
      [OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(o.status as typeof OrderStatus.DELIVERED | typeof OrderStatus.COMPLETED),
    ).length;

    const cancelRate = cancelled / total;
    const refusalRate = refused / total;
    const acceptanceRate = delivered / total;

    if (cancelRate > 0.4 || refusalRate > 0.3 || acceptanceRate < 0.5) {
      const key = `cod-abuse:${userId}`;
      await this.risk.recordEvent({
        userId,
        eventType: 'COD_ABUSE_PATTERN',
        severity: 'HIGH',
        idempotencyKey: key,
        metadata: { cancelRate, refusalRate, acceptanceRate, total },
      });

      const fraudCase = await this.cases.openCase({
        userId,
        category: FraudCaseCategory.COD_ABUSE,
        severity: 'HIGH',
        title: 'COD abuse pattern',
        description: `Cancel ${(cancelRate * 100).toFixed(0)}%, refusal ${(refusalRate * 100).toFixed(0)}%`,
        idempotencyKey: key,
      });

      await this.actions.apply(userId, FraudDecisionAction.COD_DISABLE, 'COD abuse', undefined, `${key}:action`);
      await this.alerts.raise(
        TrustAlertType.COD_ABUSE,
        'HIGH',
        'COD disabled for buyer',
        fraudCase.description,
        { userId, caseId: fraudCase.id },
      );
    }
  }
}
