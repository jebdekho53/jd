import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  FranchisePayoutStatus,
  FranchiseSettlementStatus,
  LedgerReferenceType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from '../finance/ledger.service';
import { LEDGER_ACCOUNT_CODES } from '../finance/ledger-accounts.constants';
import { OnEvent } from '@nestjs/event-emitter';
import { RazorpayService } from '../payment/razorpay.service';
import {
  RAZORPAY_TRANSFER_EVENTS,
  type RazorpayTransferEvent,
} from '../payment/razorpay-transfer.events';
import { FranchiseKycService } from './franchise-kyc.service';
import { FranchiseNotificationService } from './franchise-notification.service';

/**
 * Moves the partner's money out of the platform and into their bank.
 *
 * Replaces the old `markPaid()`, which only flipped a status column — no bank
 * account, no transfer, no proof, no way to retry a failure.
 */
@Injectable()
export class FranchisePayoutService {
  private readonly logger = new Logger(FranchisePayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly razorpay: RazorpayService,
    private readonly kyc: FranchiseKycService,
    private readonly notifications: FranchiseNotificationService,
  ) {}

  /**
   * Pay a settlement out to the partner's verified bank account.
   *
   * Idempotent on `settlementId` (unique in the schema): calling it twice for the
   * same settlement returns the existing payout instead of sending the money again.
   * A settlement is only marked PAID once the transfer has actually succeeded — a
   * Razorpay failure leaves it unpaid and the payout FAILED, so it can be retried.
   */
  async payoutSettlement(adminId: string, settlementId: string) {
    const settlement = await this.prisma.franchiseSettlement.findUnique({
      where: { id: settlementId },
      include: {
        payout: true,
        franchise: { include: { bankAccount: true } },
      },
    });
    if (!settlement) throw new NotFoundException('Settlement not found');

    // Idempotency: never pay the same settlement twice.
    if (settlement.payout && settlement.payout.status === FranchisePayoutStatus.COMPLETED) {
      return settlement.payout;
    }
    if (settlement.status === FranchiseSettlementStatus.PAID) {
      throw new BadRequestException('Settlement is already paid');
    }

    // KYC gate: a signed agreement and a verified PAN, not just a bank account.
    // Without the agreement there is no contract to pay against; without the PAN
    // the TDS we withheld is at the wrong rate.
    await this.kyc.assertPayoutAllowed(settlement.franchiseId);

    const bank = settlement.franchise.bankAccount;
    if (!bank) {
      throw new BadRequestException('Partner has no bank account on file');
    }
    if (!bank.verified) {
      throw new BadRequestException('Partner bank account is not verified yet');
    }
    if (!bank.razorpayLinkedAccountId) {
      throw new BadRequestException(
        'Partner has no Razorpay linked account — verify the bank account first',
      );
    }

    const netAmount = Number(settlement.netPayable);
    if (netAmount <= 0) {
      throw new BadRequestException('Nothing to pay out for this settlement');
    }

    // Create/refresh the payout row BEFORE talking to Razorpay, so a transfer that
    // succeeds but whose response we never see still has a record to reconcile.
    const payout = await this.prisma.franchisePayout.upsert({
      where: { settlementId },
      create: {
        franchiseId: settlement.franchiseId,
        settlementId,
        grossAmount: settlement.franchiseShare,
        gstAmount: settlement.gstAmount,
        tdsAmount: settlement.tdsAmount,
        netAmount,
        status: FranchisePayoutStatus.PROCESSING,
        attempts: 1,
        processedBy: adminId,
        bankSnapshot: {
          accountHolderName: bank.accountHolderName,
          // Only the last 4 digits — a payout record is read by support staff and
          // does not need to carry a full account number around.
          accountNumberLast4: bank.accountNumber.slice(-4),
          ifsc: bank.ifsc,
          bankName: bank.bankName,
          razorpayLinkedAccountId: bank.razorpayLinkedAccountId,
        } as Prisma.InputJsonValue,
      },
      update: {
        status: FranchisePayoutStatus.PROCESSING,
        attempts: { increment: 1 },
        failureReason: null,
        processedBy: adminId,
      },
    });

    try {
      const transfer = await this.razorpay.createTransfer({
        linkedAccountId: bank.razorpayLinkedAccountId,
        amountRupees: netAmount,
        referenceId: payout.id,
        notes: {
          settlementId,
          franchiseId: settlement.franchiseId,
          period: `${settlement.periodStart.toISOString().slice(0, 10)}..${settlement.periodEnd
            .toISOString()
            .slice(0, 10)}`,
        },
      });

      const paid = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.franchisePayout.update({
          where: { id: payout.id },
          data: {
            status: FranchisePayoutStatus.COMPLETED,
            razorpayTransferId: transfer.id,
            processedAt: new Date(),
          },
        });

        await tx.franchiseSettlement.update({
          where: { id: settlementId },
          data: { status: FranchiseSettlementStatus.PAID, paidAt: new Date() },
        });

        return updated;
      });

      // Settle the liability: we owed franchiseShare + GST, we withheld TDS and
      // owe that to the government instead, and the rest left our escrow.
      await this.ledger.postJournal({
        referenceType: LedgerReferenceType.ADJUSTMENT,
        referenceId: payout.id,
        description: `Franchise payout ${settlement.franchiseId}`,
        idempotencyKey: `franchise-payout:${payout.id}`,
        metadata: { settlementId, transferId: transfer.id, netAmount },
        lines: [
          {
            accountCode: LEDGER_ACCOUNT_CODES.FRANCHISE_PAYABLE,
            debit: Number(settlement.franchiseShare) + Number(settlement.gstAmount),
            credit: 0,
          },
          {
            accountCode: LEDGER_ACCOUNT_CODES.TDS_PAYABLE,
            debit: 0,
            credit: Number(settlement.tdsAmount),
          },
          { accountCode: LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, debit: 0, credit: netAmount },
        ],
      });

      await this.notifications.payoutCompleted(
        settlement.franchiseId,
        netAmount,
        bank.accountNumber.slice(-4),
      );

      this.logger.log(
        { payoutId: payout.id, transferId: transfer.id, netAmount },
        'Franchise payout completed',
      );
      return paid;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // The settlement is deliberately left UNPAID. Marking it paid on a failed
      // transfer would silently rob the partner of money they are still owed.
      await this.prisma.franchisePayout.update({
        where: { id: payout.id },
        data: { status: FranchisePayoutStatus.FAILED, failureReason: message },
      });

      // They are still owed this money — tell them so, rather than leaving them to
      // wonder why nothing arrived.
      await this.notifications.payoutFailed(settlement.franchiseId, netAmount, message);

      this.logger.error({ payoutId: payout.id, err: message }, 'Franchise payout failed');
      throw new BadRequestException(`Payout failed: ${message}`);
    }
  }

  /**
   * Reconcile a Route transfer that failed AFTER we optimistically marked the
   * payout COMPLETED. Without this a bank-level failure would leave the partner
   * shown as paid forever, with the ledger claiming the money left escrow.
   *
   * Reverses the payout to FAILED, the settlement back to PROCESSING (so it can be
   * paid again), posts a reversing ledger journal, and tells the partner.
   * Idempotent: a repeated or unknown transfer id is a no-op.
   */
  @OnEvent(RAZORPAY_TRANSFER_EVENTS.FAILED)
  async onTransferFailed(event: RazorpayTransferEvent): Promise<void> {
    const payout = await this.prisma.franchisePayout.findUnique({
      where: { razorpayTransferId: event.transferId },
      include: { settlement: { select: { id: true, franchiseShare: true, gstAmount: true } } },
    });
    if (!payout || payout.status !== FranchisePayoutStatus.COMPLETED) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.franchisePayout.update({
        where: { id: payout.id },
        data: {
          status: FranchisePayoutStatus.FAILED,
          failureReason: event.failureReason ?? `Transfer ${event.status}`,
        },
      });
      // Settlement goes back to unpaid so an admin can retry the payout.
      await tx.franchiseSettlement.update({
        where: { id: payout.settlementId },
        data: { status: FranchiseSettlementStatus.PROCESSING, paidAt: null },
      });
    });

    // Reverse the payout journal — the money never left escrow. Mirror of the
    // original: escrow debited back, FRANCHISE_PAYABLE re-owed, TDS liability undone.
    await this.ledger.postJournal({
      referenceType: LedgerReferenceType.ADJUSTMENT,
      referenceId: payout.id,
      description: `Franchise payout REVERSED ${payout.franchiseId}`,
      idempotencyKey: `franchise-payout-reversal:${payout.id}`,
      metadata: { transferId: event.transferId, reason: event.failureReason },
      lines: [
        { accountCode: LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, debit: Number(payout.netAmount), credit: 0 },
        { accountCode: LEDGER_ACCOUNT_CODES.TDS_PAYABLE, debit: Number(payout.tdsAmount), credit: 0 },
        {
          accountCode: LEDGER_ACCOUNT_CODES.FRANCHISE_PAYABLE,
          debit: 0,
          credit: Number(payout.settlement.franchiseShare) + Number(payout.settlement.gstAmount),
        },
      ],
    });

    await this.notifications.payoutFailed(
      payout.franchiseId,
      Number(payout.netAmount),
      event.failureReason ?? 'the bank transfer failed',
    );
    this.logger.warn(
      { payoutId: payout.id, transferId: event.transferId },
      'Franchise payout reversed after Route transfer failure',
    );
  }

  async listPayouts(franchiseId: string) {
    return this.prisma.franchisePayout.findMany({
      where: { franchiseId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
