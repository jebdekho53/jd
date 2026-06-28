import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ClaimActorType,
  OrderClaimStatus,
  OrderClaimType,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { evaluateClaimEligibility } from '../../common/utils/product-return-policy.util';
import { secureNumericCode } from '../../common/utils/secure-random.util';
import { ClaimEligibilityService } from './claim-eligibility.service';
import { ClaimRefundService } from './claim-refund.service';
import { ClaimReplacementService } from './claim-replacement.service';
import { ClaimNotificationService } from './claim-notification.service';
import { getConfig } from '../../config/configuration';
import { assertClaimEvidenceUrls } from './claim-evidence.util';
import {
  FULFILLMENT_CLAIM_ACTIONS,
  REPLACEMENT_DISPATCH_FAILED,
  TERMINAL_FULFILLMENT_CLAIM_STATUSES,
} from './order-claim.constants';
import {
  CreateOrderClaimDto,
  ListMerchantClaimsDto,
  PatchAdminClaimDto,
  PatchMerchantClaimDto,
} from './dto/order-claim.dto';

const CLAIM_INCLUDE = {
  items: { include: { product: true, orderItem: true } },
  evidence: true,
  history: { orderBy: { createdAt: 'asc' as const } },
  refund: true,
  replacement: true,
  order: { select: { orderNumber: true, status: true } },
} satisfies Prisma.OrderClaimInclude;

@Injectable()
export class OrderClaimService {
  private readonly logger = new Logger(OrderClaimService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
    private readonly eligibility: ClaimEligibilityService,
    private readonly claimRefund: ClaimRefundService,
    private readonly claimReplacement: ClaimReplacementService,
    private readonly notifications: ClaimNotificationService,
    private readonly config: ConfigService,
  ) {}

  private generateClaimNumber(): string {
    return `CLM-${secureNumericCode(8)}`;
  }

  private getUploadPublicBase(): string {
    return getConfig(this.config).storage.uploadPublicUrl;
  }

  private async resolveMerchantStoreIds(
    merchantProfileId: string,
    storeId?: string,
  ): Promise<string[]> {
    if (storeId) {
      const store = await this.prisma.store.findFirst({
        where: { id: storeId, merchantProfileId, deletedAt: null },
        select: { id: true },
      });
      if (!store) throw new NotFoundException('Store not found');
      return [store.id];
    }
    const stores = await this.prisma.store.findMany({
      where: { merchantProfileId, deletedAt: null },
      select: { id: true },
    });
    return stores.map((s) => s.id);
  }

  async createBuyerClaim(
    buyerUserId: string,
    orderId: string,
    dto: CreateOrderClaimDto,
  ) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.orderClaim.findFirst({
        where: {
          idempotencyKey: dto.idempotencyKey,
          buyerProfile: { userId: buyerUserId },
        },
        include: CLAIM_INCLUDE,
      });
      if (existing) {
        if (existing.orderId !== orderId) {
          throw new ConflictException(
            'Idempotency key already used for a different order',
          );
        }
        return this.serializeClaim(existing);
      }
    }

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        buyerProfile: { userId: buyerUserId },
        status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
      },
      include: {
        delivery: { select: { deliveredAt: true } },
        buyerProfile: { select: { id: true, userId: true } },
        items: { include: { product: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found or not eligible for claims');

    if (dto.evidence?.length) {
      assertClaimEvidenceUrls(dto.evidence, this.getUploadPublicBase());
    }

    const itemMap = new Map(order.items.map((i) => [i.id, i]));
    const claimedMap = await this.eligibility.getActiveClaimedQuantities(
      dto.items.map((l) => l.orderItemId),
    );

    let requestedAmount = 0;
    let autoApprove = true;
    const policies: ReturnType<ClaimEligibilityService['productToPolicy']>[] = [];

    for (const line of dto.items) {
      const orderItem = itemMap.get(line.orderItemId);
      if (!orderItem) throw new BadRequestException(`Invalid order item ${line.orderItemId}`);

      const alreadyClaimed = claimedMap.get(line.orderItemId) ?? 0;
      const remaining = orderItem.quantity - alreadyClaimed;
      if (remaining <= 0) {
        throw new BadRequestException(
          `No claimable quantity remaining for ${orderItem.productName}`,
        );
      }
      if (line.quantity > remaining) {
        throw new BadRequestException(
          `Quantity exceeds remaining claimable amount for ${orderItem.productName}`,
        );
      }

      const policy = this.eligibility.productToPolicy(orderItem.product);
      policies.push(policy);
      const lineAmount = Number(orderItem.unitPrice) * line.quantity;
      requestedAmount += lineAmount;

      const check = evaluateClaimEligibility({
        policy,
        claimType: dto.claimType,
        reason: dto.reason,
        deliveredAt: order.delivery?.deliveredAt ?? null,
        completedAt: order.completedAt,
        requestedAmount: lineAmount,
      });

      if (!check.eligible) {
        throw new BadRequestException(check.reason ?? 'Item not eligible for claim');
      }
      if (!check.autoApprove) autoApprove = false;

      const evidenceErr = this.eligibility.validateEvidence(policy, dto.evidence ?? []);
      if (evidenceErr) throw new BadRequestException(evidenceErr);
    }

    const restockingFee = policies.reduce((max, p) => Math.max(max, p.restockingFee), 0);
    const netAmount = Math.max(0, requestedAmount - restockingFee);
    const initialStatus = autoApprove ? OrderClaimStatus.APPROVED : OrderClaimStatus.PENDING;

    const claim = await this.prisma.$transaction(async (tx) => {
      const created = await tx.orderClaim.create({
        data: {
          claimNumber: this.generateClaimNumber(),
          orderId,
          buyerProfileId: order.buyerProfile.id,
          storeId: order.storeId,
          claimType: dto.claimType,
          status: initialStatus,
          reason: dto.reason,
          reasonNote: dto.reasonNote,
          requestedAmount: netAmount,
          approvedAmount: autoApprove ? netAmount : null,
          restockingFee,
          idempotencyKey: dto.idempotencyKey,
          items: {
            create: dto.items.map((line) => {
              const oi = itemMap.get(line.orderItemId)!;
              return {
                orderItemId: line.orderItemId,
                productId: oi.productId,
                quantityClaimed: line.quantity,
                quantityApproved: autoApprove ? line.quantity : null,
                unitPrice: oi.unitPrice,
                refundAmount: autoApprove
                  ? Number(oi.unitPrice) * line.quantity
                  : 0,
              };
            }),
          },
          evidence: dto.evidence?.length
            ? {
                create: dto.evidence.map((e) => ({ kind: e.kind, url: e.url })),
              }
            : undefined,
        },
        include: CLAIM_INCLUDE,
      });

      await this.eligibility.appendHistory(
        tx,
        created.id,
        OrderClaimStatus.PENDING,
        ClaimActorType.BUYER,
        buyerUserId,
        'Claim submitted',
      );

      if (autoApprove) {
        await this.eligibility.appendHistory(
          tx,
          created.id,
          OrderClaimStatus.APPROVED,
          ClaimActorType.SYSTEM,
          null,
          'Auto-approved per product policy',
        );
      }

      return created;
    });

    this.notifications.notifyClaimSubmitted({
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      buyerUserId: order.buyerProfile.userId,
      storeId: order.storeId,
    });

    if (autoApprove) {
      await this.fulfillApprovedClaim(claim.id, buyerUserId, ClaimActorType.SYSTEM);
      const refreshed = await this.prisma.orderClaim.findUnique({
        where: { id: claim.id },
        include: CLAIM_INCLUDE,
      });
      return this.serializeClaim(refreshed!);
    }

    return this.serializeClaim(claim);
  }

  async listBuyerClaims(buyerUserId: string, orderId: string) {
    const claims = await this.prisma.orderClaim.findMany({
      where: {
        orderId,
        buyerProfile: { userId: buyerUserId },
      },
      include: CLAIM_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return claims.map((c) => this.serializeClaim(c));
  }

  async getOrderEligibility(buyerUserId: string, orderId: string) {
    return this.eligibility.getOrderEligibility(orderId, buyerUserId);
  }

  async listMerchantClaims(userId: string, dto: ListMerchantClaimsDto) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const storeIds = await this.resolveMerchantStoreIds(profile.id, dto.storeId);

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const where: Prisma.OrderClaimWhereInput = {
      storeId: { in: storeIds },
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.claimType ? { claimType: dto.claimType } : {}),
    };

    const [total, claims] = await Promise.all([
      this.prisma.orderClaim.count({ where }),
      this.prisma.orderClaim.findMany({
        where,
        include: CLAIM_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: claims.map((c) => this.serializeClaim(c)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async patchMerchantClaim(userId: string, claimId: string, dto: PatchMerchantClaimDto) {
    const claim = await this.getClaimForMerchant(userId, claimId);
    return this.applyClaimAction(claim.id, userId, ClaimActorType.MERCHANT, dto);
  }

  async listAdminClaims(dto: ListMerchantClaimsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const where: Prisma.OrderClaimWhereInput = {
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.claimType ? { claimType: dto.claimType } : {}),
      ...(dto.storeId ? { storeId: dto.storeId } : {}),
    };

    const [total, claims] = await Promise.all([
      this.prisma.orderClaim.count({ where }),
      this.prisma.orderClaim.findMany({
        where,
        include: {
          ...CLAIM_INCLUDE,
          store: { select: { id: true, name: true } },
          buyerProfile: { select: { id: true, name: true, userId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: claims.map((c) => this.serializeClaim(c)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async patchAdminClaim(userId: string, claimId: string, dto: PatchAdminClaimDto) {
    const claim = await this.prisma.orderClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException('Claim not found');

    if (dto.adminAction === 'SUSPEND_MERCHANT') {
      const store = await this.prisma.store.findUnique({
        where: { id: claim.storeId },
        select: { merchantProfileId: true },
      });
      if (store) {
        await this.prisma.merchantProfile.update({
          where: { id: store.merchantProfileId },
          data: {
            isBlacklisted: true,
            blacklistReason: dto.note ?? 'Suspended due to claim escalation',
            blacklistedAt: new Date(),
            blacklistedBy: userId,
          },
        });
      }
    }

    if (dto.adminAction === 'FORCE_REFUND') {
      dto.action = 'APPROVE_REFUND';
    }

    return this.applyClaimAction(claimId, userId, ClaimActorType.ADMIN, dto, dto.note);
  }

  async getClaimAnalyticsForMerchant(userId: string, storeId?: string) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const storeIds = await this.resolveMerchantStoreIds(profile.id, storeId);

    const [totalOrders, claims, refunds, replacements] = await Promise.all([
      this.prisma.order.count({
        where: {
          storeId: { in: storeIds },
          status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
        },
      }),
      this.prisma.orderClaim.groupBy({
        by: ['status', 'claimType'],
        where: { storeId: { in: storeIds } },
        _count: true,
      }),
      this.prisma.claimRefund.aggregate({
        where: { claim: { storeId: { in: storeIds } }, status: 'REFUNDED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.claimReplacement.count({
        where: { claim: { storeId: { in: storeIds } } },
      }),
    ]);

    const claimCount = claims.reduce((s, c) => s + c._count, 0);
    const refundCount = claims
      .filter((c) => c.claimType === OrderClaimType.REFUND)
      .reduce((s, c) => s + c._count, 0);
    const replacementCount = claims
      .filter((c) => c.claimType === OrderClaimType.REPLACEMENT)
      .reduce((s, c) => s + c._count, 0);

    const topProducts = await this.prisma.orderClaimItem.groupBy({
      by: ['productId'],
      where: { claim: { storeId: { in: storeIds } } },
      _count: true,
      orderBy: { _count: { productId: 'desc' } },
      take: 5,
    });

    const productNames = await this.prisma.product.findMany({
      where: { id: { in: topProducts.map((p) => p.productId) } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(productNames.map((p) => [p.id, p.name]));

    return {
      refundRatePct: totalOrders > 0 ? round((refundCount / totalOrders) * 100) : 0,
      replacementRatePct: totalOrders > 0 ? round((replacementCount / totalOrders) * 100) : 0,
      totalClaims: claimCount,
      refundCost: Number(refunds._sum.amount ?? 0),
      replacementCount: replacements,
      topReturnedProducts: topProducts.map((p) => ({
        productId: p.productId,
        productName: nameMap.get(p.productId) ?? 'Unknown',
        claimCount: p._count,
      })),
      statusBreakdown: claims,
    };
  }

  private async getClaimForMerchant(userId: string, claimId: string) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const claim = await this.prisma.orderClaim.findFirst({
      where: {
        id: claimId,
        store: { merchantProfileId: profile.id, deletedAt: null },
      },
    });
    if (!claim) throw new NotFoundException('Claim not found');
    return claim;
  }

  private assertFulfillmentActionAllowed(
    claim: {
      status: OrderClaimStatus;
      refund: { status: PaymentStatus } | null;
      replacement: { status: string } | null;
    },
    action: PatchMerchantClaimDto['action'],
  ): void {
    if (!FULFILLMENT_CLAIM_ACTIONS.has(action)) return;

    const isDispatchRetry =
      action === 'ISSUE_REPLACEMENT' &&
      claim.replacement?.status === REPLACEMENT_DISPATCH_FAILED;

    if (isDispatchRetry) return;

    if (TERMINAL_FULFILLMENT_CLAIM_STATUSES.includes(claim.status)) {
      throw new BadRequestException(`Claim is already ${claim.status}`);
    }

    if (
      (action === 'APPROVE_REFUND' || action === 'APPROVE') &&
      claim.refund?.status === PaymentStatus.REFUNDED
    ) {
      throw new BadRequestException('Refund has already been processed for this claim');
    }
  }

  private async applyClaimAction(
    claimId: string,
    actorId: string,
    actorType: ClaimActorType,
    dto: PatchMerchantClaimDto,
    adminNote?: string,
  ) {
    const claim = await this.prisma.orderClaim.findUnique({
      where: { id: claimId },
      include: {
        order: { include: { buyerProfile: { select: { userId: true } } } },
        refund: true,
        replacement: true,
      },
    });
    if (!claim) throw new NotFoundException('Claim not found');

    this.assertFulfillmentActionAllowed(claim, dto.action);

    const noteField =
      actorType === ClaimActorType.ADMIN
        ? { adminNote: adminNote ?? dto.note }
        : { merchantNote: dto.note };

    switch (dto.action) {
      case 'REQUEST_EVIDENCE':
        await this.prisma.$transaction(async (tx) => {
          await tx.orderClaim.update({
            where: { id: claimId },
            data: { status: OrderClaimStatus.EVIDENCE_REQUESTED, ...noteField },
          });
          await this.eligibility.appendHistory(
            tx,
            claimId,
            OrderClaimStatus.EVIDENCE_REQUESTED,
            actorType,
            actorId,
            dto.note,
          );
        });
        break;

      case 'REJECT':
        await this.prisma.$transaction(async (tx) => {
          await tx.orderClaim.update({
            where: { id: claimId },
            data: {
              status: OrderClaimStatus.REJECTED,
              resolvedAt: new Date(),
              ...noteField,
            },
          });
          await this.eligibility.appendHistory(
            tx,
            claimId,
            OrderClaimStatus.REJECTED,
            actorType,
            actorId,
            dto.note,
          );
        });
        break;

      case 'APPROVE':
      case 'APPROVE_REFUND':
      case 'APPROVE_REPLACEMENT': {
        const approvedAmount = dto.approvedAmount ?? Number(claim.requestedAmount);
        await this.prisma.$transaction(async (tx) => {
          await tx.orderClaim.update({
            where: { id: claimId },
            data: {
              status: OrderClaimStatus.APPROVED,
              approvedAmount,
              returnPickupEnabled: dto.returnPickupEnabled ?? claim.returnPickupEnabled,
              ...noteField,
            },
          });
          const items = await tx.orderClaimItem.findMany({ where: { claimId } });
          for (const item of items) {
            await tx.orderClaimItem.update({
              where: { id: item.id },
              data: {
                quantityApproved: item.quantityClaimed,
                refundAmount: Number(item.unitPrice) * item.quantityClaimed,
              },
            });
          }
          await this.eligibility.appendHistory(
            tx,
            claimId,
            OrderClaimStatus.APPROVED,
            actorType,
            actorId,
            dto.note,
            { approvedAmount },
          );
        });
        await this.fulfillApprovedClaim(claimId, actorId, actorType, dto.action);
        break;
      }

      case 'ISSUE_REPLACEMENT':
        await this.claimReplacement.issueReplacement(claimId, actorId, actorType, true);
        break;

      default:
        throw new BadRequestException('Unknown action');
    }

    const updated = await this.prisma.orderClaim.findUnique({
      where: { id: claimId },
      include: CLAIM_INCLUDE,
    });

    this.notifications.notifyClaimStatus({
      claimId,
      claimNumber: claim.claimNumber,
      buyerUserId: claim.order.buyerProfile.userId,
      storeId: claim.storeId,
      status: updated!.status,
    });

    return this.serializeClaim(updated!);
  }

  private async fulfillApprovedClaim(
    claimId: string,
    actorId: string,
    actorType: ClaimActorType,
    action?: PatchMerchantClaimDto['action'],
  ): Promise<void> {
    const claim = await this.prisma.orderClaim.findUnique({
      where: { id: claimId },
      include: { refund: true },
    });
    if (!claim || claim.status !== OrderClaimStatus.APPROVED) return;

    if (
      claim.claimType === OrderClaimType.REFUND ||
      claim.claimType === OrderClaimType.RETURN ||
      action === 'APPROVE_REFUND'
    ) {
      if (claim.refund?.status === PaymentStatus.REFUNDED) return;
      await this.prisma.orderClaim.update({
        where: { id: claimId },
        data: { status: OrderClaimStatus.REFUND_PROCESSING },
      });
      await this.claimRefund.processRefund(claimId, actorId, actorType);
      return;
    }

    if (
      claim.claimType === OrderClaimType.REPLACEMENT ||
      action === 'APPROVE_REPLACEMENT' ||
      action === 'ISSUE_REPLACEMENT'
    ) {
      await this.claimReplacement.issueReplacement(claimId, actorId, actorType, true);
    }
  }

  private serializeClaim(claim: Prisma.OrderClaimGetPayload<{ include: typeof CLAIM_INCLUDE }>) {
    return {
      id: claim.id,
      claimNumber: claim.claimNumber,
      orderId: claim.orderId,
      orderNumber: claim.order?.orderNumber,
      storeId: claim.storeId,
      claimType: claim.claimType,
      status: claim.status,
      reason: claim.reason,
      reasonNote: claim.reasonNote,
      requestedAmount: Number(claim.requestedAmount),
      approvedAmount: claim.approvedAmount ? Number(claim.approvedAmount) : null,
      restockingFee: Number(claim.restockingFee),
      merchantNote: claim.merchantNote,
      adminNote: claim.adminNote,
      replacementOrderId: claim.replacementOrderId,
      returnPickupEnabled: claim.returnPickupEnabled,
      resolvedAt: claim.resolvedAt,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt,
      items: claim.items.map((i) => ({
        id: i.id,
        orderItemId: i.orderItemId,
        productId: i.productId,
        productName: i.orderItem?.productName,
        quantityClaimed: i.quantityClaimed,
        quantityApproved: i.quantityApproved,
        unitPrice: Number(i.unitPrice),
        refundAmount: Number(i.refundAmount),
      })),
      evidence: claim.evidence,
      history: claim.history,
      refund: claim.refund
        ? {
            ...claim.refund,
            amount: Number(claim.refund.amount),
            walletAmount: Number(claim.refund.walletAmount),
            razorpayAmount: Number(claim.refund.razorpayAmount),
          }
        : null,
      replacement: claim.replacement,
    };
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
