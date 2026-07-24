import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  ClaimActorType,
  ClaimRefundMethod,
  OrderClaimStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  SettlementLedgerStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from '../payment/razorpay.service';
import { LedgerService } from '../finance/ledger.service';
import { WalletService } from '../wallet-loyalty/wallet.service';
import { WalletTransactionType } from '@prisma/client';
import { ClaimEligibilityService } from './claim-eligibility.service';
import { CreditNoteService } from '../compliance/credit-note.service';

@Injectable()
export class ClaimRefundService {
  private readonly logger = new Logger(ClaimRefundService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
    private readonly ledger: LedgerService,
    private readonly wallet: WalletService,
    private readonly eligibility: ClaimEligibilityService,
    private readonly creditNotes: CreditNoteService,
  ) {}

  async processRefund(claimId: string, actorId: string, actorType: ClaimActorType): Promise<void> {
    const claim = await this.prisma.orderClaim.findUnique({
      where: { id: claimId },
      include: {
        items: { include: { product: true } },
        order: { include: { payment: true, buyerProfile: { include: { wallet: true } } } },
        refund: true,
      },
    });

    if (!claim) throw new BadRequestException('Claim not found');
    if (claim.refund?.status === PaymentStatus.REFUNDED) {
      return;
    }

    const amount = Number(claim.approvedAmount ?? claim.requestedAmount);
    if (amount <= 0) throw new BadRequestException('Refund amount must be positive');

    const idempotencyKey = `claim-refund:${claimId}`;

    const product = claim.items[0]?.product;
    const refundMethod = product
      ? this.eligibility.productToPolicy(product).refundMethod
      : ClaimRefundMethod.ORIGINAL_PAYMENT;

    let walletAmount = 0;
    let razorpayAmount = 0;

    if (refundMethod === ClaimRefundMethod.WALLET) {
      walletAmount = amount;
    } else if (refundMethod === ClaimRefundMethod.BOTH) {
      const razorpayPaid = Number(claim.order.razorpayAmount ?? 0);
      razorpayAmount = Math.min(amount, razorpayPaid);
      walletAmount = round(amount - razorpayAmount);
    } else {
      if (
        claim.order.paymentMethod === PaymentMethod.COD ||
        !claim.order.payment?.razorpayPaymentId
      ) {
        walletAmount = amount;
      } else {
        razorpayAmount = amount;
      }
    }

    const priorRzp = await this.prisma.claimRefund.aggregate({
      where: {
        status: PaymentStatus.REFUNDED,
        claim: { orderId: claim.orderId },
        NOT: { claimId },
      },
      _sum: { razorpayAmount: true },
    });
    const orderRzpCap = Number(claim.order.razorpayAmount ?? 0);
    const remainingRzp = round(
      orderRzpCap - Number(priorRzp._sum.razorpayAmount ?? 0),
    );
    if (razorpayAmount > 0) {
      razorpayAmount = Math.min(razorpayAmount, Math.max(0, remainingRzp));
    }
    walletAmount = Math.min(walletAmount, round(amount - razorpayAmount));

    let refundRecord = await this.prisma.claimRefund.findUnique({ where: { claimId } });
    if (!refundRecord) {
      refundRecord = await this.prisma.claimRefund.create({
        data: {
          claimId,
          amount,
          walletAmount,
          razorpayAmount,
          status: PaymentStatus.PENDING,
          idempotencyKey,
        },
      });
    } else if (refundRecord.status === PaymentStatus.REFUNDED) {
      return;
    } else {
      refundRecord = await this.prisma.claimRefund.update({
        where: { id: refundRecord.id },
        data: {
          amount,
          walletAmount,
          razorpayAmount,
        },
      });
    }

    let razorpayRefundId = refundRecord.razorpayRefundId;
    let walletTxnId = refundRecord.walletTxnId;

    if (razorpayAmount > 0 && !razorpayRefundId) {
      const paymentId = claim.order.payment?.razorpayPaymentId;
      if (!paymentId || !this.razorpay.isConfigured()) {
        walletAmount = round(walletAmount + razorpayAmount);
        razorpayAmount = 0;
      } else {
        const result = await this.razorpay.createRefund(
          paymentId,
          razorpayAmount,
          { claimId, claimNumber: claim.claimNumber },
        );
        razorpayRefundId = result.id;
        refundRecord = await this.prisma.claimRefund.update({
          where: { id: refundRecord.id },
          data: { razorpayRefundId, razorpayAmount },
        });
        const existingTxn = await this.prisma.paymentTransaction.findFirst({
          where: { razorpayRefundId: result.id },
        });
        if (!existingTxn && claim.order.payment) {
          await this.prisma.paymentTransaction.create({
            data: {
              paymentId: claim.order.payment.id,
              type: 'REFUND',
              amount: razorpayAmount,
              status: PaymentStatus.REFUNDED,
              razorpayRefundId: result.id,
              metadata: { claimId } as Prisma.InputJsonValue,
            },
          });
        }
      }
    }

    if (walletAmount > 0 && !walletTxnId) {
      const buyerWallet = claim.order.buyerProfile.wallet;
      if (!buyerWallet) throw new BadRequestException('Buyer wallet not found for refund');
      const txn = await this.prisma.$transaction(async (tx) =>
        this.wallet.creditWallet(
          tx,
          buyerWallet.id,
          walletAmount,
          WalletTransactionType.REFUND,
          {
            referenceType: 'claim',
            referenceId: claimId,
            description: `Refund for claim ${claim.claimNumber}`,
            idempotencyKey: `claim-wallet:${claimId}`,
            createdBy: actorId,
          },
        ),
      );
      walletTxnId = txn.id;
      await this.wallet.emitWalletCredited(
        buyerWallet.id,
        claim.buyerProfileId,
        walletAmount,
        claimId,
      );
      void this.ledger.recordWalletCredit(walletTxnId, walletAmount).catch((err) => {
        this.logger.error({ err, claimId }, 'Claim wallet ledger failed');
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.claimRefund.update({
        where: { id: refundRecord.id },
        data: {
          walletAmount,
          razorpayAmount,
          razorpayRefundId,
          walletTxnId,
          status: PaymentStatus.REFUNDED,
          processedAt: new Date(),
        },
      });
      await tx.orderClaim.update({
        where: { id: claimId },
        data: {
          status: OrderClaimStatus.REFUND_PROCESSED,
          resolvedAt: new Date(),
        },
      });
      await this.eligibility.appendHistory(
        tx,
        claimId,
        OrderClaimStatus.REFUND_PROCESSED,
        actorType,
        actorId,
        `Refund processed: ₹${amount}`,
        { walletAmount, razorpayAmount, razorpayRefundId },
      );
    });

    void this.ledger.recordClaimRefund(claimId, claim.orderId, amount).catch((err) => {
      this.logger.error({ err, claimId }, 'Claim refund ledger failed');
    });

    // The buyer got their money back — the merchant must not keep the earnings
    // (or the platform its commission) on the refunded share of this order.
    // Without this, every claim refund was a straight platform loss: the buyer
    // refund AND the merchant's full settlement both went out.
    try {
      await this.clawbackMerchantSettlement(claim.orderId, amount);
    } catch (err) {
      this.logger.error({ err, claimId }, 'Claim refund merchant clawback failed');
    }

    void this.creditNotes
      .createForRefund(
        claim.orderId,
        `Claim refund ${claim.claimNumber}`,
        claim.items.map((i) => ({
          orderItemId: i.orderItemId,
          quantity: i.quantityApproved ?? i.quantityClaimed,
        })),
      )
      .catch((err) => {
        this.logger.error({ err, claimId }, 'Claim credit note failed');
      });
  }
  /** Reduce the merchant's settlement by the same proportion of the order that
   *  was refunded to the buyer. Applies whether the ledger is still PENDING
   *  (deduct from pendingBalance before it's ever paid out) or already SETTLED
   *  (deduct from availableBalance — nets against the merchant's next payout). */
  private async clawbackMerchantSettlement(orderId: string, refundAmount: number): Promise<void> {
    const [snapshot, ledger, order] = await Promise.all([
      this.prisma.orderFinancialSnapshot.findUnique({ where: { orderId } }),
      this.prisma.settlementLedger.findUnique({ where: { orderId } }),
      this.prisma.order.findUnique({ where: { id: orderId }, select: { totalAmount: true } }),
    ]);
    // No settlement exists yet (order not delivered) — nothing to claw back;
    // the eventual settlement will simply never be created for a fully refunded order.
    if (!snapshot || !ledger || !order) return;

    const orderTotal = Number(order.totalAmount);
    if (orderTotal <= 0) return;
    const fraction = Math.min(1, refundAmount / orderTotal);
    const merchantClawback = round(Number(snapshot.netMerchantEarnings) * fraction);
    if (merchantClawback <= 0) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.settlementLedger.update({
        where: { id: ledger.id },
        data: { netAmount: { decrement: merchantClawback } },
      });
      await tx.merchantWallet.update({
        where: { merchantProfileId: ledger.merchantProfileId },
        data:
          ledger.status === SettlementLedgerStatus.SETTLED
            ? { availableBalance: { decrement: merchantClawback }, totalEarned: { decrement: merchantClawback } }
            : { pendingBalance: { decrement: merchantClawback }, totalEarned: { decrement: merchantClawback } },
      });
    });

    this.logger.log({ orderId, merchantClawback, refundAmount }, 'Merchant settlement clawed back for claim refund');
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
