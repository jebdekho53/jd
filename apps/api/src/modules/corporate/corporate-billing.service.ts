import { Injectable } from '@nestjs/common';
import { LedgerReferenceType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from '../finance/ledger.service';
import { LEDGER_ACCOUNT_CODES } from '../finance/ledger-accounts.constants';

@Injectable()
export class CorporateBillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async generateMonthlyInvoice(accountId: string, periodStart: Date, periodEnd: Date) {
    const orders = await this.prisma.purchaseRequest.findMany({
      where: {
        employee: { accountId },
        status: 'APPROVED',
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    });

    const invoiceAmount = orders.reduce((s, o) => s + Number(o.amount), 0);
    if (invoiceAmount <= 0) return null;

    const invoiceNumber = `CORP-${accountId.slice(0, 6).toUpperCase()}-${Date.now()}`;

    const journalId = await this.ledger.postJournal({
      referenceType: LedgerReferenceType.ADJUSTMENT,
      referenceId: accountId,
      description: `Corporate invoice ${invoiceNumber}`,
      idempotencyKey: `corp-inv-${invoiceNumber}`,
      lines: [
        { accountCode: LEDGER_ACCOUNT_CODES.CUSTOMER_RECEIVABLE, debit: invoiceAmount, credit: 0 },
        { accountCode: LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, debit: 0, credit: invoiceAmount },
      ],
    });

    return this.prisma.corporateInvoice.create({
      data: {
        accountId,
        invoiceNumber,
        invoiceAmount,
        periodStart,
        periodEnd,
        ledgerJournalId: journalId,
      },
    });
  }

  async listInvoices(accountId: string) {
    return this.prisma.corporateInvoice.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
