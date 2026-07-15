import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DeliveryStatus, LedgerReferenceType, RiderPayoutStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { startOfIstDay, startOfIstWeek } from '../../common/utils/ist-day.util';
import { LedgerService } from './ledger.service';
import { LEDGER_ACCOUNT_CODES } from './ledger-accounts.constants';
import { FinanceCacheService } from './finance-cache.service';
import { decimalToNumber, roundMoney } from '../settlement/settlement.utils';
import { RazorpayService } from '../payment/razorpay.service';
import {
  RAZORPAY_TRANSFER_EVENTS,
  type RazorpayTransferEvent,
} from '../payment/razorpay-transfer.events';

@Injectable()
export class RiderPayoutService {
  private readonly logger = new Logger(RiderPayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly cache: FinanceCacheService,
    private readonly razorpay: RazorpayService,
  ) {}

  async getRiderEarnings(riderProfileId: string) {
    const todayStart = startOfIstDay();
    const weekStart = startOfIstWeek();

    const deliveries = await this.prisma.delivery.findMany({
      where: { riderProfileId, status: DeliveryStatus.DELIVERED },
      include: { order: { select: { orderNumber: true, paymentMethod: true, totalAmount: true } } },
      orderBy: { deliveredAt: 'desc' },
      take: 100,
    });

    const sum = (from: Date) =>
      deliveries
        .filter((d) => d.deliveredAt && d.deliveredAt >= from)
        .reduce((s, d) => s + decimalToNumber(d.riderEarning ?? 0), 0);

    const [pendingPayout, paidPayouts] = await Promise.all([
      this.prisma.riderPayout.findFirst({
        where: { riderProfileId, status: RiderPayoutStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.riderPayout.aggregate({
        where: { riderProfileId, status: RiderPayoutStatus.PAID },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      today: roundMoney(sum(todayStart)),
      thisWeek: roundMoney(sum(weekStart)),
      pendingPayout: pendingPayout ? decimalToNumber(pendingPayout.totalAmount) : 0,
      totalPaid: decimalToNumber(paidPayouts._sum.totalAmount),
      recentDeliveries: deliveries.slice(0, 10).map((d) => ({
        orderNumber: d.order.orderNumber,
        earning: decimalToNumber(d.riderEarning ?? 0),
        deliveredAt: d.deliveredAt?.toISOString() ?? null,
        paymentMethod: d.order.paymentMethod,
      })),
    };
  }

  async generateWeeklyPayout(riderProfileId: string) {
    const weekStart = startOfIstWeek();
    const weekEnd = new Date();

    const deliveries = await this.prisma.delivery.findMany({
      where: {
        riderProfileId,
        status: DeliveryStatus.DELIVERED,
        deliveredAt: { gte: weekStart, lte: weekEnd },
        riderPayoutItems: { none: {} },
      },
      include: { order: { select: { id: true, financialSnapshot: true } } },
    });

    if (deliveries.length === 0) return null;

    let baseFee = 0;
    let distanceBonus = 0;
    for (const d of deliveries) {
      const earning = decimalToNumber(d.riderEarning ?? 0);
      baseFee += earning * 0.7;
      distanceBonus += earning * 0.3;
    }
    baseFee = roundMoney(baseFee);
    distanceBonus = roundMoney(distanceBonus);
    const total = roundMoney(baseFee + distanceBonus);

    const payout = await this.prisma.riderPayout.create({
      data: {
        riderProfileId,
        periodStart: weekStart,
        periodEnd: weekEnd,
        baseFee,
        distanceBonus,
        totalAmount: total,
        items: {
          create: deliveries.map((d) => ({
            deliveryId: d.id,
            orderId: d.orderId,
            amount: d.riderEarning ?? 0,
          })),
        },
      },
    });

    await this.cache.invalidatePayouts();
    return payout;
  }

  async markPaid(payoutId: string, adminUserId: string, referenceId: string) {
    const payout = await this.prisma.riderPayout.update({
      where: { id: payoutId },
      data: {
        status: RiderPayoutStatus.PAID,
        paidAt: new Date(),
        referenceId,
      },
    });

    await this.ledger.recordRiderPayout(
      payoutId,
      payout.riderProfileId,
      decimalToNumber(payout.totalAmount),
    );
    await this.cache.invalidatePayouts();

    return payout;
  }

  /**
   * Pay a rider payout via Razorpay Route instead of a manual bank transfer.
   * Requires a verified rider bank account (which carries the linked account).
   * Marks the payout PAID optimistically; a bank-level failure is reconciled by
   * the webhook (onTransferFailed). Idempotent: an already-paid payout is returned.
   */
  async processViaRoute(payoutId: string, adminUserId: string) {
    const payout = await this.prisma.riderPayout.findUnique({
      where: { id: payoutId },
      include: { riderProfile: { include: { bankAccount: true } } },
    });
    if (!payout) throw new NotFoundException('Rider payout not found');
    if (payout.status === RiderPayoutStatus.PAID) return payout;

    const bank = payout.riderProfile.bankAccount;
    if (!bank || !bank.verified || !bank.razorpayLinkedAccountId) {
      throw new BadRequestException('Rider bank account is not verified yet');
    }
    if (!this.razorpay.isRouteEnabled()) {
      throw new BadRequestException('Razorpay Route is not enabled');
    }

    const amount = decimalToNumber(payout.totalAmount);
    if (amount <= 0) throw new BadRequestException('Nothing to pay out');

    let transferId: string;
    try {
      const transfer = await this.razorpay.createTransfer({
        linkedAccountId: bank.razorpayLinkedAccountId,
        amountRupees: amount,
        referenceId: payoutId,
        notes: { riderPayoutId: payoutId },
      });
      transferId = transfer.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.prisma.riderPayout.update({
        where: { id: payoutId },
        data: { status: RiderPayoutStatus.FAILED, failureReason: message.slice(0, 500) },
      });
      throw new BadRequestException(`Rider payout transfer failed: ${message}`);
    }

    const updated = await this.prisma.riderPayout.update({
      where: { id: payoutId },
      data: { status: RiderPayoutStatus.PAID, paidAt: new Date(), referenceId: transferId, failureReason: null },
    });
    await this.ledger.recordRiderPayout(payoutId, payout.riderProfileId, amount);
    await this.cache.invalidatePayouts();
    this.logger.log({ payoutId, transferId }, 'Rider payout paid via Route');
    return updated;
  }

  /**
   * Reconcile a rider Route transfer that failed after we marked the payout PAID.
   * Reverts to FAILED (retryable) and reverses the ledger. Idempotent / no-op for
   * unknown transfers. Listens on the same bus the payment webhook broadcasts on.
   */
  @OnEvent(RAZORPAY_TRANSFER_EVENTS.FAILED)
  async onTransferFailed(event: RazorpayTransferEvent): Promise<void> {
    const payout = await this.prisma.riderPayout.findFirst({
      where: { referenceId: event.transferId, status: RiderPayoutStatus.PAID },
    });
    if (!payout) return;

    await this.prisma.riderPayout.update({
      where: { id: payout.id },
      data: {
        status: RiderPayoutStatus.FAILED,
        paidAt: null,
        failureReason: (event.failureReason ?? `Transfer ${event.status}`).slice(0, 500),
      },
    });
    // Reverse the payout journal (swap of recordRiderPayout's lines).
    await this.ledger.postJournal({
      referenceType: LedgerReferenceType.RIDER_PAYOUT,
      referenceId: payout.id,
      description: `Rider payout REVERSED ${payout.id}`,
      idempotencyKey: `rider-payout-reversal:${payout.id}`,
      metadata: { transferId: event.transferId, reason: event.failureReason },
      lines: [
        { accountCode: LEDGER_ACCOUNT_CODES.CUSTOMER_RECEIVABLE, debit: decimalToNumber(payout.totalAmount), credit: 0 },
        { accountCode: LEDGER_ACCOUNT_CODES.RIDER_PAYABLE, debit: 0, credit: decimalToNumber(payout.totalAmount) },
      ],
    });
    await this.cache.invalidatePayouts();
    this.logger.warn({ payoutId: payout.id, transferId: event.transferId }, 'Rider payout reversed after Route failure');
  }

  async listAdmin(page = 1, limit = 25) {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.riderPayout.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { riderProfile: { select: { name: true } }, _count: { select: { items: true } } },
      }),
      this.prisma.riderPayout.count(),
    ]);

    return {
      payouts: rows.map((p) => ({
        id: p.id,
        rider: p.riderProfile.name,
        riderProfileId: p.riderProfileId,
        status: p.status,
        totalAmount: decimalToNumber(p.totalAmount),
        deliveryCount: p._count.items,
        periodStart: p.periodStart.toISOString(),
        periodEnd: p.periodEnd.toISOString(),
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
      meta: { page, limit, total },
    };
  }
}
