import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CodReconciliationStatus, DeliveryProviderType, LedgerReferenceType, PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from './ledger.service';
import { FinanceAlertService } from './finance-alert.service';
import { decimalToNumber, roundMoney } from '../settlement/settlement.utils';

@Injectable()
export class CodReconciliationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly alerts: FinanceAlertService,
  ) {}

  async createForDeliveredOrder(
    orderId: string,
    riderProfileId: string | null,
    providerType?: DeliveryProviderType | null,
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, totalAmount: true, paymentMethod: true },
    });
    if (!order) return;
    const isCod =
      order.paymentMethod === PaymentMethod.COD ||
      order.paymentMethod === PaymentMethod.WALLET_COD;
    if (!isCod) return;

    const existing = await this.prisma.codReconciliation.findFirst({
      where: { orderId },
    });
    if (existing) return;

    if (!riderProfileId && !providerType) {
      return;
    }

    await this.prisma.codReconciliation.create({
      data: {
        riderProfileId: riderProfileId ?? undefined,
        providerType: providerType ?? undefined,
        orderId,
        amountExpected: order.totalAmount,
        amountCollected: order.totalAmount,
        status: CodReconciliationStatus.PENDING,
      },
    });
  }

  /** A rider's own COD cash still to be deposited (PENDING records + total). */
  async getRiderPendingCod(riderProfileId: string) {
    const records = await this.prisma.codReconciliation.findMany({
      where: { riderProfileId, status: CodReconciliationStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: { order: { select: { orderNumber: true } } },
    });
    const totalToDeposit = roundMoney(
      records.reduce((s, r) => s + decimalToNumber(r.amountExpected), 0),
    );
    return {
      totalToDeposit,
      count: records.length,
      items: records.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        orderNumber: r.order?.orderNumber ?? null,
        amount: decimalToNumber(r.amountExpected),
        collectedAt: r.createdAt.toISOString(),
      })),
    };
  }

  async submitRemittance(
    riderProfileId: string,
    input: { orderIds: string[]; amountDeposited: number; notes?: string },
  ) {
    const records = await this.prisma.codReconciliation.findMany({
      where: {
        riderProfileId,
        orderId: { in: input.orderIds },
        status: CodReconciliationStatus.PENDING,
      },
    });
    if (records.length === 0) throw new BadRequestException('No pending COD records found');

    const expected = roundMoney(records.reduce((s, r) => s + decimalToNumber(r.amountExpected), 0));
    const mismatch = roundMoney(Math.abs(expected - input.amountDeposited));
    const now = new Date();

    // Allocate the single deposited amount across orders proportionally to what
    // each order actually owed — an even split hid which specific order's cash
    // was short. The last record absorbs the rounding remainder so the parts
    // still sum to the real amountDeposited.
    let allocatedSoFar = 0;
    const updates = records.map((r, idx) => {
      const recordExpected = decimalToNumber(r.amountExpected);
      const isLast = idx === records.length - 1;
      const allocatedDeposit = isLast
        ? roundMoney(input.amountDeposited - allocatedSoFar)
        : roundMoney(expected > 0 ? (recordExpected / expected) * input.amountDeposited : 0);
      allocatedSoFar = roundMoney(allocatedSoFar + allocatedDeposit);
      return this.prisma.codReconciliation.update({
        where: { id: r.id },
        data: {
          status: CodReconciliationStatus.SUBMITTED,
          amountDeposited: allocatedDeposit,
          mismatchAmount: roundMoney(Math.abs(allocatedDeposit - recordExpected)),
          submittedAt: now,
          notes: input.notes,
        },
      });
    });

    await this.prisma.$transaction(updates);

    if (mismatch > 1) {
      await this.alerts.raiseCodMismatch(riderProfileId, mismatch);
    }

    return { submitted: records.length, expected, deposited: input.amountDeposited, mismatch };
  }

  async verify(adminUserId: string, id: string) {
    const record = await this.prisma.codReconciliation.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('COD record not found');
    if (record.status !== CodReconciliationStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted remittances can be verified');
    }

    const updated = await this.prisma.codReconciliation.update({
      where: { id },
      data: {
        status: CodReconciliationStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedBy: adminUserId,
      },
    });

    const amount = decimalToNumber(updated.amountDeposited);
    if (amount > 0 && updated.orderId) {
      await this.ledger.postJournal({
        referenceType: LedgerReferenceType.COD_REMITTANCE,
        referenceId: id,
        orderId: updated.orderId,
        description: `COD remittance verified ${id}`,
        idempotencyKey: `cod-remit:${id}`,
        lines: [
          { accountCode: 'PLATFORM_ESCROW', debit: amount, credit: 0 },
          { accountCode: 'COD_COLLECTED', debit: 0, credit: amount },
        ],
      });
    }

    return updated;
  }

  async reject(adminUserId: string, id: string, reason: string) {
    const record = await this.prisma.codReconciliation.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('COD record not found');

    return this.prisma.codReconciliation.update({
      where: { id },
      data: {
        status: CodReconciliationStatus.REJECTED,
        verifiedBy: adminUserId,
        verifiedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }

  async listAdmin(status?: CodReconciliationStatus, page = 1, limit = 25) {
    const where: Prisma.CodReconciliationWhereInput = status ? { status } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.codReconciliation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          riderProfile: { select: { name: true } },
          order: { select: { orderNumber: true } },
        },
      }),
      this.prisma.codReconciliation.count({ where }),
    ]);

    return {
      records: rows.map((r) => ({
        id: r.id,
        rider: r.riderProfile?.name ?? (r.providerType ? `Provider ${r.providerType}` : 'Unknown'),
        orderNumber: r.order?.orderNumber ?? null,
        amountExpected: decimalToNumber(r.amountExpected),
        amountCollected: decimalToNumber(r.amountCollected),
        amountDeposited: decimalToNumber(r.amountDeposited),
        mismatchAmount: decimalToNumber(r.mismatchAmount),
        status: r.status,
        submittedAt: r.submittedAt?.toISOString() ?? null,
      })),
      meta: { page, limit, total },
    };
  }

  async getSummary() {
    const [pending, submitted, verified, rejected] = await Promise.all([
      this.prisma.codReconciliation.aggregate({
        where: { status: CodReconciliationStatus.PENDING },
        _sum: { amountExpected: true },
        _count: { id: true },
      }),
      this.prisma.codReconciliation.aggregate({
        where: { status: CodReconciliationStatus.SUBMITTED },
        _sum: { amountExpected: true },
        _count: { id: true },
      }),
      this.prisma.codReconciliation.aggregate({
        where: { status: CodReconciliationStatus.VERIFIED },
        _sum: { amountDeposited: true },
        _count: { id: true },
      }),
      this.prisma.codReconciliation.count({
        where: { status: CodReconciliationStatus.REJECTED, mismatchAmount: { gt: 0 } },
      }),
    ]);

    return {
      codPending: decimalToNumber(pending._sum.amountExpected),
      codPendingCount: pending._count.id,
      codSubmitted: decimalToNumber(submitted._sum.amountExpected),
      codSubmittedCount: submitted._count.id,
      codDeposited: decimalToNumber(verified._sum.amountDeposited),
      codVerifiedCount: verified._count.id,
      mismatchCount: rejected,
    };
  }
}
