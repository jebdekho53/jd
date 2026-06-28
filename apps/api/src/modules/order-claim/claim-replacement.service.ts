import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  ClaimActorType,
  OrderClaimStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DeliveryOrchestratorService } from '../logistics/delivery-orchestrator.service';
import { ClaimEligibilityService } from './claim-eligibility.service';
import { secureNumericCode } from '../../common/utils/secure-random.util';
import { REPLACEMENT_DISPATCH_FAILED } from './order-claim.constants';

function generateOrderNumber(): string {
  return `JD${secureNumericCode(10)}`;
}

@Injectable()
export class ClaimReplacementService {
  private readonly logger = new Logger(ClaimReplacementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: DeliveryOrchestratorService,
    private readonly eligibility: ClaimEligibilityService,
  ) {}

  async issueReplacement(
    claimId: string,
    actorId: string,
    actorType: ClaimActorType,
    dispatchShipment = true,
  ): Promise<{ replacementOrderId: string; shipmentId?: string }> {
    const claim = await this.prisma.orderClaim.findUnique({
      where: { id: claimId },
      include: {
        items: { include: { orderItem: true } },
        order: true,
        replacement: true,
      },
    });

    if (!claim) throw new BadRequestException('Claim not found');

    if (claim.replacement?.status === 'SHIPPED' && claim.replacement.shipmentId) {
      return {
        replacementOrderId: claim.replacement.replacementOrderId,
        shipmentId: claim.replacement.shipmentId,
      };
    }

    if (
      claim.replacement &&
      (claim.replacement.status === REPLACEMENT_DISPATCH_FAILED ||
        claim.replacement.status === 'PENDING')
    ) {
      const shipmentId = dispatchShipment
        ? await this.dispatchReplacementShipment(
            claimId,
            claim.replacement.replacementOrderId,
            actorId,
            actorType,
          )
        : undefined;
      return {
        replacementOrderId: claim.replacement.replacementOrderId,
        shipmentId,
      };
    }

    if (claim.replacement) {
      return {
        replacementOrderId: claim.replacement.replacementOrderId,
        shipmentId: claim.replacement.shipmentId ?? undefined,
      };
    }

    const original = claim.order;
    let replacementOrderId = '';

    await this.prisma.$transaction(async (tx) => {
      const orderNumber = generateOrderNumber();
      const subtotal = claim.items.reduce(
        (sum, i) => sum + Number(i.unitPrice) * (i.quantityApproved ?? i.quantityClaimed),
        0,
      );

      const replacementOrder = await tx.order.create({
        data: {
          orderNumber,
          buyerProfileId: original.buyerProfileId,
          storeId: original.storeId,
          status: OrderStatus.MERCHANT_ACCEPTED,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PAID,
          subtotal,
          discountAmount: 0,
          deliveryFee: 0,
          taxAmount: 0,
          totalAmount: 0,
          walletAmountUsed: 0,
          deliveryAddress: original.deliveryAddress as Prisma.InputJsonValue,
          deliveryLat: original.deliveryLat,
          deliveryLng: original.deliveryLng,
          orderVertical: original.orderVertical,
          buyerNote: `REPLACEMENT_FOR_CLAIM:${claim.claimNumber}`,
          paidAt: new Date(),
        },
      });

      for (const item of claim.items) {
        const qty = item.quantityApproved ?? item.quantityClaimed;
        const oi = item.orderItem;
        await tx.orderItem.create({
          data: {
            orderId: replacementOrder.id,
            productId: oi.productId,
            variantId: oi.variantId,
            productName: oi.productName,
            variantName: oi.variantName,
            sku: oi.sku,
            quantity: qty,
            unitPrice: item.unitPrice,
            discount: 0,
            tax: 0,
            totalPrice: Number(item.unitPrice) * qty,
          },
        });
      }

      replacementOrderId = replacementOrder.id;

      await tx.claimReplacement.create({
        data: {
          claimId,
          replacementOrderId,
          status: 'PENDING',
        },
      });

      await tx.orderClaim.update({
        where: { id: claimId },
        data: {
          status: OrderClaimStatus.REPLACEMENT_APPROVED,
          replacementOrderId,
        },
      });

      await this.eligibility.appendHistory(
        tx,
        claimId,
        OrderClaimStatus.REPLACEMENT_APPROVED,
        actorType,
        actorId,
        'Replacement order created',
        { replacementOrderId },
      );
    });

    let shipmentId: string | undefined;
    if (dispatchShipment) {
      shipmentId = await this.dispatchReplacementShipment(
        claimId,
        replacementOrderId,
        actorId,
        actorType,
      );
    }

    return { replacementOrderId, shipmentId };
  }

  private async dispatchReplacementShipment(
    claimId: string,
    replacementOrderId: string,
    actorId: string,
    actorType: ClaimActorType,
  ): Promise<string | undefined> {
    try {
      const dispatch = await this.delivery.dispatchShipment(replacementOrderId);
      await this.prisma.$transaction(async (tx) => {
        await tx.claimReplacement.update({
          where: { claimId },
          data: {
            shipmentId: dispatch.shipmentId,
            status: 'SHIPPED',
            shippedAt: new Date(),
          },
        });
        await tx.orderClaim.update({
          where: { id: claimId },
          data: { status: OrderClaimStatus.REPLACEMENT_SHIPPED },
        });
        await this.eligibility.appendHistory(
          tx,
          claimId,
          OrderClaimStatus.REPLACEMENT_SHIPPED,
          ClaimActorType.SYSTEM,
          null,
          'Replacement shipment dispatched',
          { shipmentId: dispatch.shipmentId },
        );
      });
      return dispatch.shipmentId;
    } catch (err) {
      this.logger.error({ err, claimId, replacementOrderId }, 'Replacement dispatch failed');
      await this.prisma.$transaction(async (tx) => {
        await tx.claimReplacement.update({
          where: { claimId },
          data: { status: REPLACEMENT_DISPATCH_FAILED },
        });
        await this.eligibility.appendHistory(
          tx,
          claimId,
          OrderClaimStatus.REPLACEMENT_APPROVED,
          actorType,
          actorId,
          'Replacement dispatch failed — retry required',
          { replacementOrderId, error: String(err) },
        );
      });
      throw new BadRequestException(
        'Replacement order created but dispatch failed; retry with ISSUE_REPLACEMENT',
      );
    }
  }
}
