import { Injectable } from '@nestjs/common';
import {
  ClaimActorType,
  OrderClaimStatus,
  OrderClaimType,
  OrderStatus,
  Prisma,
  ReturnClaimReason,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  buildReturnPolicySummary,
  evaluateClaimEligibility,
  ProductPolicyInput,
  validateEvidenceForPolicy,
} from '../../common/utils/product-return-policy.util';
import { INACTIVE_CLAIM_STATUSES } from './order-claim.constants';

export interface OrderClaimEligibility {
  orderId: string;
  deliveredAt: Date | null;
  actions: {
    return: boolean;
    refund: boolean;
    replacement: boolean;
  };
  items: Array<{
    orderItemId: string;
    productId: string;
    productName: string;
    maxQuantity: number;
    policy: ReturnType<typeof buildReturnPolicySummary>;
    claimTypes: OrderClaimType[];
    reasons: ReturnClaimReason[];
  }>;
}

@Injectable()
export class ClaimEligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveClaimedQuantities(orderItemIds: string[]): Promise<Map<string, number>> {
    if (!orderItemIds.length) return new Map();

    const rows = await this.prisma.orderClaimItem.groupBy({
      by: ['orderItemId'],
      where: {
        orderItemId: { in: orderItemIds },
        claim: { status: { notIn: INACTIVE_CLAIM_STATUSES } },
      },
      _sum: { quantityClaimed: true },
    });

    return new Map(
      rows.map((r) => [r.orderItemId, r._sum.quantityClaimed ?? 0]),
    );
  }

  productToPolicy(product: {
    isReturnable: boolean;
    isRefundable: boolean;
    isReplaceable: boolean;
    returnWindowHours: number | null;
    approvalMode: ProductPolicyInput['approvalMode'];
    proofRequired: ProductPolicyInput['proofRequired'];
    autoApproveBelowAmount: Prisma.Decimal | null;
    returnReasons: ReturnClaimReason[];
    restockingFee: Prisma.Decimal;
    refundMethod: ProductPolicyInput['refundMethod'];
    returnPolicyText: string | null;
    replacementPolicyText: string | null;
    preparedFoodPolicy: ProductPolicyInput['preparedFoodPolicy'];
    allowCustomerChangedMind: boolean;
  }): ProductPolicyInput {
    return {
      isReturnable: product.isReturnable,
      isRefundable: product.isRefundable,
      isReplaceable: product.isReplaceable,
      returnWindowHours: product.returnWindowHours,
      approvalMode: product.approvalMode,
      proofRequired: product.proofRequired,
      autoApproveBelowAmount: product.autoApproveBelowAmount
        ? Number(product.autoApproveBelowAmount)
        : null,
      returnReasons: product.returnReasons,
      restockingFee: Number(product.restockingFee),
      refundMethod: product.refundMethod,
      returnPolicyText: product.returnPolicyText,
      replacementPolicyText: product.replacementPolicyText,
      preparedFoodPolicy: product.preparedFoodPolicy,
      allowCustomerChangedMind: product.allowCustomerChangedMind,
    };
  }

  async getOrderEligibility(orderId: string, buyerUserId: string): Promise<OrderClaimEligibility> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        buyerProfile: { userId: buyerUserId },
        status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
      },
      include: {
        delivery: { select: { deliveredAt: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                isReturnable: true,
                isRefundable: true,
                isReplaceable: true,
                returnWindowHours: true,
                approvalMode: true,
                proofRequired: true,
                autoApproveBelowAmount: true,
                returnReasons: true,
                restockingFee: true,
                refundMethod: true,
                returnPolicyText: true,
                replacementPolicyText: true,
                preparedFoodPolicy: true,
                allowCustomerChangedMind: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return {
        orderId,
        deliveredAt: null,
        actions: { return: false, refund: false, replacement: false },
        items: [],
      };
    }

    const deliveredAt = order.delivery?.deliveredAt ?? order.completedAt;
    const claimedMap = await this.getActiveClaimedQuantities(
      order.items.map((i) => i.id),
    );

    const items = order.items.map((item) => {
      const policy = this.productToPolicy(item.product);
      const summary = buildReturnPolicySummary(policy);
      const alreadyClaimed = claimedMap.get(item.id) ?? 0;
      const remaining = Math.max(0, item.quantity - alreadyClaimed);
      const claimTypes: OrderClaimType[] = [];

      if (remaining > 0) {
        for (const type of [
          OrderClaimType.RETURN,
          OrderClaimType.REFUND,
          OrderClaimType.REPLACEMENT,
        ]) {
          const check = evaluateClaimEligibility({
            policy,
            claimType: type,
            reason: ReturnClaimReason.OTHER,
            deliveredAt,
            completedAt: order.completedAt,
            requestedAmount: Number(item.unitPrice) * remaining,
          });
          if (check.eligible) claimTypes.push(type);
        }
      }

      return {
        orderItemId: item.id,
        productId: item.productId,
        productName: item.productName,
        maxQuantity: remaining,
        policy: summary,
        claimTypes,
        reasons:
          policy.returnReasons.length > 0
            ? policy.returnReasons
            : Object.values(ReturnClaimReason),
      };
    });

    return {
      orderId,
      deliveredAt,
      actions: {
        return: items.some((i) => i.claimTypes.includes(OrderClaimType.RETURN)),
        refund: items.some((i) => i.claimTypes.includes(OrderClaimType.REFUND)),
        replacement: items.some((i) => i.claimTypes.includes(OrderClaimType.REPLACEMENT)),
      },
      items,
    };
  }

  validateEvidence(
    policy: ProductPolicyInput,
    evidence: Array<{ kind: string }>,
  ): string | null {
    const photoCount = evidence.filter((e) => e.kind === 'PHOTO').length;
    const videoCount = evidence.filter((e) => e.kind === 'VIDEO').length;
    return validateEvidenceForPolicy(policy, photoCount, videoCount);
  }

  async appendHistory(
    tx: Prisma.TransactionClient,
    claimId: string,
    status: OrderClaimStatus,
    actorType: ClaimActorType,
    actorId: string | null,
    note?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await tx.claimHistory.create({
      data: {
        claimId,
        status,
        actorType,
        actorId,
        note,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }
}
