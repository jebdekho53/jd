import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LedgerAccountKind, LedgerReferenceType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LEDGER_ACCOUNT_CODES } from './ledger-accounts.constants';

export interface LedgerLine {
  accountCode: string;
  debit: number;
  credit: number;
}

@Injectable()
export class LedgerService implements OnModuleInit {
  private readonly logger = new Logger(LedgerService.name);
  private accountCache = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.refreshAccountCache();
  }

  async refreshAccountCache(): Promise<void> {
    const accounts = await this.prisma.ledgerAccount.findMany({ where: { isActive: true } });
    this.accountCache.clear();
    for (const a of accounts) this.accountCache.set(a.code, a.id);
  }

  async postJournal(input: {
    referenceType: LedgerReferenceType;
    referenceId: string;
    orderId?: string;
    description: string;
    idempotencyKey: string;
    lines: LedgerLine[];
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const existing = await this.prisma.ledgerJournal.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true },
    });
    if (existing) return existing.id;

    const totalDebit = round(input.lines.reduce((s, l) => s + l.debit, 0));
    const totalCredit = round(input.lines.reduce((s, l) => s + l.credit, 0));
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Unbalanced journal: debit=${totalDebit} credit=${totalCredit}`,
      );
    }

    await this.ensureAccounts();

    const journal = await this.prisma.$transaction(async (tx) => {
      const j = await tx.ledgerJournal.create({
        data: {
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          orderId: input.orderId,
          description: input.description,
          idempotencyKey: input.idempotencyKey,
          metadata: input.metadata as Prisma.InputJsonValue,
        },
      });

      for (const line of input.lines) {
        const accountId = this.accountCache.get(line.accountCode);
        if (!accountId) throw new BadRequestException(`Unknown account: ${line.accountCode}`);
        await tx.ledgerEntry.create({
          data: {
            journalId: j.id,
            accountId,
            debit: line.debit,
            credit: line.credit,
          },
        });
      }
      return j;
    });

    return journal.id;
  }

  async recordOrderPayment(orderId: string, amount: number, isCod: boolean): Promise<void> {
    if (amount <= 0) return;
    const debitAccount = isCod
      ? LEDGER_ACCOUNT_CODES.COD_COLLECTED
      : LEDGER_ACCOUNT_CODES.CUSTOMER_RECEIVABLE;

    await this.postJournal({
      referenceType: LedgerReferenceType.ORDER_PAYMENT,
      referenceId: orderId,
      orderId,
      description: isCod ? 'COD order created' : 'Order payment received',
      idempotencyKey: `order-payment:${orderId}`,
      lines: [
        { accountCode: debitAccount, debit: amount, credit: 0 },
        { accountCode: LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, debit: 0, credit: amount },
      ],
    });
  }

  async recordMerchantSettlement(
    orderId: string,
    merchantProfileId: string,
    gross: number,
    commission: number,
    net: number,
  ): Promise<void> {
    await this.postJournal({
      referenceType: LedgerReferenceType.MERCHANT_SETTLEMENT,
      referenceId: orderId,
      orderId,
      description: `Merchant settlement for order ${orderId}`,
      idempotencyKey: `merchant-settlement:${orderId}`,
      lines: [
        { accountCode: LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, debit: gross, credit: 0 },
        { accountCode: LEDGER_ACCOUNT_CODES.MERCHANT_PAYABLE, debit: 0, credit: net },
        { accountCode: LEDGER_ACCOUNT_CODES.PLATFORM_COMMISSION, debit: 0, credit: commission },
      ],
      metadata: { merchantProfileId },
    });
  }

  async recordMerchantPayout(
    payoutId: string,
    merchantProfileId: string,
    amount: number,
  ): Promise<void> {
    await this.postJournal({
      referenceType: LedgerReferenceType.MERCHANT_PAYOUT,
      referenceId: payoutId,
      description: `Merchant payout ${payoutId}`,
      idempotencyKey: `merchant-payout:${payoutId}`,
      lines: [
        { accountCode: LEDGER_ACCOUNT_CODES.MERCHANT_PAYABLE, debit: amount, credit: 0 },
        { accountCode: LEDGER_ACCOUNT_CODES.CUSTOMER_RECEIVABLE, debit: 0, credit: amount },
      ],
      metadata: { merchantProfileId },
    });
  }

  async recordRefund(orderId: string, amount: number): Promise<void> {
    if (amount <= 0) return;
    await this.postJournal({
      referenceType: LedgerReferenceType.REFUND,
      referenceId: orderId,
      orderId,
      description: `Refund for order ${orderId}`,
      idempotencyKey: `refund:${orderId}`,
      lines: [
        { accountCode: LEDGER_ACCOUNT_CODES.REFUND_EXPENSE, debit: amount, credit: 0 },
        { accountCode: LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, debit: 0, credit: amount },
      ],
    });
  }

  async recordWalletCredit(walletTxnId: string, amount: number): Promise<void> {
    await this.postJournal({
      referenceType: LedgerReferenceType.WALLET_CREDIT,
      referenceId: walletTxnId,
      description: `Wallet credit ${walletTxnId}`,
      idempotencyKey: `wallet-credit:${walletTxnId}`,
      lines: [
        { accountCode: LEDGER_ACCOUNT_CODES.PROMOTION_EXPENSE, debit: amount, credit: 0 },
        { accountCode: LEDGER_ACCOUNT_CODES.WALLET_LIABILITY, debit: 0, credit: amount },
      ],
    });
  }

  async recordRiderPayout(payoutId: string, riderProfileId: string, amount: number): Promise<void> {
    await this.postJournal({
      referenceType: LedgerReferenceType.RIDER_PAYOUT,
      referenceId: payoutId,
      description: `Rider payout ${payoutId}`,
      idempotencyKey: `rider-payout:${payoutId}`,
      lines: [
        { accountCode: LEDGER_ACCOUNT_CODES.RIDER_PAYABLE, debit: amount, credit: 0 },
        { accountCode: LEDGER_ACCOUNT_CODES.CUSTOMER_RECEIVABLE, debit: 0, credit: amount },
      ],
      metadata: { riderProfileId },
    });
  }

  async recordTaxAccrual(orderId: string, taxAmount: number, taxableAmount: number): Promise<void> {
    if (taxAmount <= 0) return;
    await this.postJournal({
      referenceType: LedgerReferenceType.TAX_ACCRUAL,
      referenceId: orderId,
      orderId,
      description: `GST accrual order ${orderId}`,
      idempotencyKey: `tax:${orderId}`,
      lines: [
        { accountCode: LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, debit: taxAmount, credit: 0 },
        { accountCode: LEDGER_ACCOUNT_CODES.GST_PAYABLE, debit: 0, credit: taxAmount },
      ],
      metadata: { taxableAmount },
    });
  }

  async getAccountBalances(): Promise<Array<{ code: string; name: string; debit: number; credit: number; balance: number }>> {
    const accounts = await this.prisma.ledgerAccount.findMany({ where: { isActive: true } });
    const result = [];
    for (const acct of accounts) {
      const agg = await this.prisma.ledgerEntry.aggregate({
        where: { accountId: acct.id },
        _sum: { debit: true, credit: true },
      });
      const debit = Number(agg._sum.debit ?? 0);
      const credit = Number(agg._sum.credit ?? 0);
      const balance =
        acct.kind === LedgerAccountKind.ASSET || acct.kind === LedgerAccountKind.EXPENSE
          ? debit - credit
          : credit - debit;
      result.push({ code: acct.code, name: acct.name, debit, credit, balance });
    }
    return result;
  }

  private async ensureAccounts(): Promise<void> {
    if (this.accountCache.size > 0) return;
    await this.refreshAccountCache();
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
