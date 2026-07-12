import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  PayoutRequestStatus,
  PayoutTransactionStatus,
  Prisma,
  SettlementLedgerStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { startOfIstDay } from '../../common/utils/ist-day.util';
import { AuditService } from '../audit/audit.service';
import { SettlementCommissionService } from './settlement-commission.service';
import { FinanceCommissionService } from '../finance/finance-commission.service';
import { LedgerService } from '../finance/ledger.service';
import { FinanceCacheService } from '../finance/finance-cache.service';
import { addDays, decimalToNumber, roundMoney } from './settlement.utils';
import { RazorpayService } from '../payment/razorpay.service';
import { CreatePayoutRequestDto } from './dto/create-payout-request.dto';
import { RejectPayoutRequestDto } from './dto/reject-payout-request.dto';
import { ListSettlementsQueryDto } from './dto/list-settlements-query.dto';

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly commission: SettlementCommissionService,
    private readonly financeCommission: FinanceCommissionService,
    private readonly ledger: LedgerService,
    private readonly financeCache: FinanceCacheService,
    private readonly audit: AuditService,
    private readonly razorpay: RazorpayService,
  ) {}

  // ── Automation: on order delivered ─────────────────────────────────────────

  async createLedgerForDeliveredOrder(orderId: string, actorId?: string): Promise<void> {
    const existing = await this.prisma.settlementLedger.findUnique({
      where: { orderId },
      select: { id: true },
    });
    if (existing) {
      this.logger.debug(`Settlement already exists for order ${orderId}`);
      return;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        storeId: true,
        subtotal: true,
        deliveryFee: true,
        taxAmount: true,
        status: true,
        store: { select: { merchantProfileId: true } },
        financialSnapshot: true,
      },
    });

    if (!order?.store?.merchantProfileId) {
      this.logger.warn(`No merchant for order ${orderId}, skipping settlement`);
      return;
    }

    const merchantProfileId = order.store.merchantProfileId;
    const snapshot = order.financialSnapshot;

    const commissionPercent = snapshot
      ? decimalToNumber(snapshot.commissionPercent)
      : (await this.financeCommission.resolveForOrder(order.storeId, orderId)).commissionPercent;

    const settlementDelay = snapshot
      ? 2
      : (await this.commission.resolveForOrder(merchantProfileId, orderId)).settlementDelayDays;

    const grossAmount = snapshot
      ? decimalToNumber(snapshot.subtotal)
      : decimalToNumber(order.subtotal);
    const deliveryFee = decimalToNumber(order.deliveryFee);
    const taxAmount = decimalToNumber(order.taxAmount);
    const platformCommission = snapshot
      ? decimalToNumber(snapshot.commissionAmount)
      : roundMoney((grossAmount * commissionPercent) / 100);
    const netAmount = snapshot
      ? decimalToNumber(snapshot.netMerchantEarnings)
      : roundMoney(grossAmount - platformCommission);
    const now = new Date();
    const eligibleAt = addDays(now, settlementDelay);

    await this.prisma.$transaction(async (tx) => {
      await tx.merchantWallet.upsert({
        where: { merchantProfileId },
        create: {
          merchantProfileId,
          pendingBalance: netAmount,
          totalEarned: netAmount,
        },
        update: {
          pendingBalance: { increment: netAmount },
          totalEarned: { increment: netAmount },
        },
      });

      await tx.settlementLedger.create({
        data: {
          merchantProfileId,
          orderId,
          grossAmount,
          deliveryFee,
          platformCommission,
          taxAmount,
          netAmount,
          commissionPercent,
          status: SettlementLedgerStatus.PENDING,
          eligibleAt,
        },
      });
    });

    await this.audit.log({
      actorId: actorId ?? 'system',
      action: 'SETTLEMENT_CREATED',
      resourceType: 'settlement_ledger',
      resourceId: orderId,
      metadata: {
        orderNumber: order.orderNumber,
        merchantProfileId,
        netAmount,
        commissionPercent,
        eligibleAt: eligibleAt.toISOString(),
      } as Prisma.InputJsonValue,
    });

    this.logger.log({ orderId, merchantProfileId, netAmount }, 'Settlement ledger created');
    void this.financeCache.invalidateSettlements();
  }

  // ── Automation: T+N eligible → available ───────────────────────────────────

  async processEligibleSettlements(): Promise<number> {
    const now = new Date();
    const eligible = await this.prisma.settlementLedger.findMany({
      where: {
        status: SettlementLedgerStatus.PENDING,
        eligibleAt: { lte: now },
      },
      take: 200,
      select: { id: true, merchantProfileId: true, netAmount: true, orderId: true },
    });

    let processed = 0;
    for (const entry of eligible) {
      const net = decimalToNumber(entry.netAmount);
      try {
        await this.prisma.$transaction(async (tx) => {
          const updated = await tx.settlementLedger.updateMany({
            where: { id: entry.id, status: SettlementLedgerStatus.PENDING },
            data: {
              status: SettlementLedgerStatus.SETTLED,
              settledAt: now,
            },
          });
          if (updated.count === 0) return;

          await tx.merchantWallet.update({
            where: { merchantProfileId: entry.merchantProfileId },
            data: {
              pendingBalance: { decrement: net },
              availableBalance: { increment: net },
            },
          });
        });
        processed += 1;
        await this.audit.log({
          actorId: 'system',
          action: 'SETTLEMENT_SETTLED',
          resourceType: 'settlement_ledger',
          resourceId: entry.id,
          metadata: { orderId: entry.orderId, netAmount: net } as Prisma.InputJsonValue,
        });
      } catch (err) {
        this.logger.error({ err, ledgerId: entry.id }, 'Failed to settle ledger entry');
      }
    }
    return processed;
  }

  // ── Merchant: resolve profile ──────────────────────────────────────────────

  private async requireMerchantProfile(userId: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      select: { id: true, businessName: true },
    });
    if (!profile) throw new NotFoundException('Merchant profile not found');
    return profile;
  }

  private async getOrCreateWallet(merchantProfileId: string) {
    return this.prisma.merchantWallet.upsert({
      where: { merchantProfileId },
      create: { merchantProfileId },
      update: {},
    });
  }

  // ── Merchant APIs ─────────────────────────────────────────────────────────

  async getMerchantEarnings(userId: string) {
    const profile = await this.requireMerchantProfile(userId);
    const wallet = await this.getOrCreateWallet(profile.id);

    const [recentLedger, recentOrders, commissionSummary, openPayout] = await Promise.all([
      this.prisma.settlementLedger.findMany({
        where: { merchantProfileId: profile.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderId: true,
          grossAmount: true,
          platformCommission: true,
          netAmount: true,
          status: true,
          createdAt: true,
          order: { select: { orderNumber: true } },
        },
      }),
      this.prisma.settlementLedger.findMany({
        where: { merchantProfileId: profile.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          orderId: true,
          grossAmount: true,
          netAmount: true,
          createdAt: true,
          order: { select: { orderNumber: true, totalAmount: true } },
        },
      }),
      this.prisma.settlementLedger.aggregate({
        where: { merchantProfileId: profile.id },
        _sum: { platformCommission: true, grossAmount: true, netAmount: true },
      }),
      this.prisma.payoutRequest.findFirst({
        where: {
          merchantProfileId: profile.id,
          status: { in: [PayoutRequestStatus.PENDING, PayoutRequestStatus.APPROVED, PayoutRequestStatus.PROCESSING] },
        },
        orderBy: { requestedAt: 'desc' },
      }),
    ]);

    return {
      wallet: {
        availableBalance: decimalToNumber(wallet.availableBalance),
        pendingBalance: decimalToNumber(wallet.pendingBalance),
        totalEarned: decimalToNumber(wallet.totalEarned),
        totalPaidOut: decimalToNumber(wallet.totalPaidOut),
      },
      commissionBreakdown: {
        totalGross: decimalToNumber(commissionSummary._sum.grossAmount),
        totalCommission: decimalToNumber(commissionSummary._sum.platformCommission),
        totalNet: decimalToNumber(commissionSummary._sum.netAmount),
      },
      recentOrdersRevenue: recentOrders.map((r) => ({
        orderId: r.orderId,
        orderNumber: r.order.orderNumber,
        orderTotal: decimalToNumber(r.order.totalAmount),
        grossAmount: decimalToNumber(r.grossAmount),
        netAmount: decimalToNumber(r.netAmount),
        createdAt: r.createdAt.toISOString(),
      })),
      settlementHistory: recentLedger.map((l) => ({
        id: l.id,
        orderId: l.orderId,
        orderNumber: l.order.orderNumber,
        grossAmount: decimalToNumber(l.grossAmount),
        platformCommission: decimalToNumber(l.platformCommission),
        netAmount: decimalToNumber(l.netAmount),
        status: l.status,
        createdAt: l.createdAt.toISOString(),
      })),
      openPayoutRequest: openPayout
        ? {
            id: openPayout.id,
            amount: decimalToNumber(openPayout.amount),
            status: openPayout.status,
            requestedAt: openPayout.requestedAt.toISOString(),
          }
        : null,
    };
  }

  async listMerchantSettlements(userId: string, query: ListSettlementsQueryDto) {
    const profile = await this.requireMerchantProfile(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SettlementLedgerWhereInput = {
      merchantProfileId: profile.id,
      ...(query.status ? { status: query.status as SettlementLedgerStatus } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.settlementLedger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { order: { select: { orderNumber: true } } },
      }),
      this.prisma.settlementLedger.count({ where }),
    ]);

    return {
      settlements: items.map((l) => ({
        id: l.id,
        orderId: l.orderId,
        orderNumber: l.order.orderNumber,
        grossAmount: decimalToNumber(l.grossAmount),
        deliveryFee: decimalToNumber(l.deliveryFee),
        platformCommission: decimalToNumber(l.platformCommission),
        taxAmount: decimalToNumber(l.taxAmount),
        netAmount: decimalToNumber(l.netAmount),
        commissionPercent: decimalToNumber(l.commissionPercent),
        status: l.status,
        eligibleAt: l.eligibleAt.toISOString(),
        settledAt: l.settledAt?.toISOString() ?? null,
        createdAt: l.createdAt.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createPayoutRequest(userId: string, dto: CreatePayoutRequestDto) {
    const profile = await this.requireMerchantProfile(userId);
    const amount = roundMoney(dto.amount);

    if (amount <= 0) throw new BadRequestException('Payout amount must be positive');

    const bankDetailsSnapshot = {
      accountHolderName: dto.accountHolderName,
      accountNumber: dto.accountNumber,
      ifsc: dto.ifsc,
      bankName: dto.bankName ?? null,
    };

    const payout = await this.prisma.$transaction(async (tx) => {
      const open = await tx.payoutRequest.count({
        where: {
          merchantProfileId: profile.id,
          status: { in: [PayoutRequestStatus.PENDING, PayoutRequestStatus.APPROVED, PayoutRequestStatus.PROCESSING] },
        },
      });
      if (open > 0) {
        throw new ConflictException('An open payout request already exists');
      }

      const wallet = await tx.merchantWallet.findUnique({
        where: { merchantProfileId: profile.id },
      });
      const available = decimalToNumber(wallet?.availableBalance);
      if (!wallet || amount > available) {
        throw new BadRequestException(`Insufficient available balance (₹${available})`);
      }

      return tx.payoutRequest.create({
        data: {
          merchantProfileId: profile.id,
          amount,
          bankDetailsSnapshot,
        },
      });
    });

    await this.audit.log({
      actorId: userId,
      action: 'PAYOUT_REQUESTED',
      resourceType: 'payout_request',
      resourceId: payout.id,
      metadata: { amount, merchantProfileId: profile.id } as Prisma.InputJsonValue,
    });

    return {
      id: payout.id,
      amount: decimalToNumber(payout.amount),
      status: payout.status,
      requestedAt: payout.requestedAt.toISOString(),
    };
  }

  async listMerchantPayouts(userId: string, query: ListSettlementsQueryDto) {
    const profile = await this.requireMerchantProfile(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.payoutRequest.findMany({
        where: { merchantProfileId: profile.id },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
        include: { transactions: { orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
      this.prisma.payoutRequest.count({ where: { merchantProfileId: profile.id } }),
    ]);

    return {
      payouts: items.map((p) => ({
        id: p.id,
        amount: decimalToNumber(p.amount),
        status: p.status,
        rejectionReason: p.rejectionReason,
        requestedAt: p.requestedAt.toISOString(),
        reviewedAt: p.reviewedAt?.toISOString() ?? null,
        processedAt: p.processedAt?.toISOString() ?? null,
        transaction: p.transactions[0]
          ? {
              id: p.transactions[0].id,
              status: p.transactions[0].status,
              referenceId: p.transactions[0].referenceId,
            }
          : null,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Admin APIs ──────────────────────────────────────────────────────────────

  async getAdminSettlementsOverview() {
    const todayStart = startOfIstDay();

    const [
      pendingPayouts,
      completedPayouts,
      liability,
      settledToday,
      wallets,
      recentLedger,
    ] = await Promise.all([
      this.prisma.payoutRequest.count({
        where: { status: { in: [PayoutRequestStatus.PENDING, PayoutRequestStatus.APPROVED, PayoutRequestStatus.PROCESSING] } },
      }),
      this.prisma.payoutRequest.count({ where: { status: PayoutRequestStatus.COMPLETED } }),
      this.prisma.merchantWallet.aggregate({
        _sum: { availableBalance: true, pendingBalance: true },
      }),
      this.prisma.settlementLedger.aggregate({
        where: { settledAt: { gte: todayStart }, status: SettlementLedgerStatus.SETTLED },
        _sum: { netAmount: true },
        _count: { id: true },
      }),
      this.prisma.merchantWallet.findMany({
        orderBy: { availableBalance: 'desc' },
        take: 20,
        include: { merchantProfile: { select: { businessName: true } } },
      }),
      this.prisma.settlementLedger.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          order: { select: { orderNumber: true } },
          merchantProfile: { select: { businessName: true } },
        },
      }),
    ]);

    return {
      summary: {
        pendingPayouts,
        completedPayouts,
        totalMerchantLiability:
          decimalToNumber(liability._sum.availableBalance) +
          decimalToNumber(liability._sum.pendingBalance),
        availableLiability: decimalToNumber(liability._sum.availableBalance),
        pendingLiability: decimalToNumber(liability._sum.pendingBalance),
        totalSettledToday: decimalToNumber(settledToday._sum.netAmount),
        settlementsSettledToday: settledToday._count.id,
      },
      merchantWallets: wallets.map((w) => ({
        merchantProfileId: w.merchantProfileId,
        businessName: w.merchantProfile.businessName,
        availableBalance: decimalToNumber(w.availableBalance),
        pendingBalance: decimalToNumber(w.pendingBalance),
        totalEarned: decimalToNumber(w.totalEarned),
        totalPaidOut: decimalToNumber(w.totalPaidOut),
      })),
      settlementLedger: recentLedger.map((l) => ({
        id: l.id,
        orderNumber: l.order.orderNumber,
        merchant: l.merchantProfile.businessName,
        netAmount: decimalToNumber(l.netAmount),
        status: l.status,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  }

  async listAdminPayoutRequests(query: ListSettlementsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: Prisma.PayoutRequestWhereInput = {
      ...(query.status ? { status: query.status as PayoutRequestStatus } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.payoutRequest.findMany({
        where,
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
        include: {
          merchantProfile: { select: { businessName: true, gstNumber: true } },
          transactions: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.payoutRequest.count({ where }),
    ]);

    return {
      payoutRequests: items.map((p) => ({
        id: p.id,
        merchant: p.merchantProfile.businessName,
        merchantProfileId: p.merchantProfileId,
        gstNumber: p.merchantProfile.gstNumber,
        amount: decimalToNumber(p.amount),
        status: p.status,
        bankDetails: p.bankDetailsSnapshot,
        rejectionReason: p.rejectionReason,
        requestedAt: p.requestedAt.toISOString(),
        reviewedAt: p.reviewedAt?.toISOString() ?? null,
        processedAt: p.processedAt?.toISOString() ?? null,
        transaction: p.transactions[0] ?? null,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Create (or attach) a Razorpay Route Linked Account for a merchant so future
   * payouts settle to them automatically. Idempotent: returns the existing id if
   * already linked, or accepts a pre-created `acc_xxx` to attach without calling
   * Razorpay again.
   */
  async linkMerchantRouteAccount(
    adminUserId: string,
    merchantProfileId: string,
    existingAccountId?: string,
  ): Promise<{ merchantProfileId: string; razorpayLinkedAccountId: string; created: boolean }> {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantProfileId },
      include: {
        user: { select: { email: true, phone: true } },
        merchantApplication: { include: { bankAccount: true } },
      },
    });
    if (!profile) throw new NotFoundException('Merchant not found');

    if (profile.razorpayLinkedAccountId) {
      return {
        merchantProfileId,
        razorpayLinkedAccountId: profile.razorpayLinkedAccountId,
        created: false,
      };
    }

    let accountId = existingAccountId?.trim();
    let created = false;

    if (!accountId) {
      const bank = profile.merchantApplication?.bankAccount;
      const email = profile.user?.email;
      const phone = profile.user?.phone;
      if (!bank) {
        throw new BadRequestException('Merchant has no verified bank account to link');
      }
      if (!email || !phone) {
        throw new BadRequestException('Merchant email and phone are required to create a linked account');
      }
      const result = await this.razorpay.createLinkedAccount({
        email,
        phone,
        legalBusinessName: profile.businessName,
        referenceId: merchantProfileId,
        bank: {
          accountHolderName: bank.accountHolderName,
          accountNumber: bank.accountNumber,
          ifsc: bank.ifsc,
        },
      });
      accountId = result.accountId;
      created = true;
    }

    await this.prisma.merchantProfile.update({
      where: { id: merchantProfileId },
      data: { razorpayLinkedAccountId: accountId },
    });

    await this.audit.log({
      actorId: adminUserId,
      action: 'MERCHANT_ROUTE_ACCOUNT_LINKED',
      resourceType: 'merchant_profile',
      resourceId: merchantProfileId,
      metadata: { razorpayLinkedAccountId: accountId, created } as Prisma.InputJsonValue,
    });

    return { merchantProfileId, razorpayLinkedAccountId: accountId, created };
  }

  async approvePayoutRequest(adminUserId: string, payoutId: string) {
    const now = new Date();

    const payout = await this.prisma.$transaction(async (tx) => {
      const request = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
      if (!request) throw new NotFoundException('Payout request not found');
      if (request.status !== PayoutRequestStatus.PENDING) {
        throw new BadRequestException(`Cannot approve payout in status ${request.status}`);
      }

      const wallet = await tx.merchantWallet.findUnique({
        where: { merchantProfileId: request.merchantProfileId },
      });
      const amount = decimalToNumber(request.amount);
      const available = decimalToNumber(wallet?.availableBalance);
      if (!wallet || amount > available) {
        throw new BadRequestException('Merchant has insufficient available balance');
      }

      await tx.merchantWallet.update({
        where: { merchantProfileId: request.merchantProfileId },
        data: { availableBalance: { decrement: amount } },
      });

      return tx.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: PayoutRequestStatus.APPROVED,
          reviewedAt: now,
          reviewedBy: adminUserId,
        },
      });
    });

    await this.audit.log({
      actorId: adminUserId,
      action: 'PAYOUT_APPROVED',
      resourceType: 'payout_request',
      resourceId: payoutId,
      metadata: { amount: decimalToNumber(payout.amount) } as Prisma.InputJsonValue,
    });

    return { id: payout.id, status: payout.status };
  }

  async rejectPayoutRequest(adminUserId: string, payoutId: string, dto: RejectPayoutRequestDto) {
    const now = new Date();

    const existing = await this.prisma.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!existing) throw new NotFoundException('Payout request not found');
    if (existing.status !== PayoutRequestStatus.PENDING) {
      throw new BadRequestException('Only pending payouts can be rejected');
    }

    const payout = await this.prisma.payoutRequest.update({
      where: { id: payoutId },
      data: {
        status: PayoutRequestStatus.REJECTED,
        rejectionReason: dto.reason,
        reviewedAt: now,
        reviewedBy: adminUserId,
      },
    });

    await this.audit.log({
      actorId: adminUserId,
      action: 'PAYOUT_REJECTED',
      resourceType: 'payout_request',
      resourceId: payoutId,
      metadata: { reason: dto.reason } as Prisma.InputJsonValue,
    });

    return { id: payout.id, status: payout.status };
  }

  async processPayoutRequest(adminUserId: string, payoutId: string) {
    const now = new Date();

    // Move the money BEFORE the DB transaction: a Razorpay Route transfer is a
    // network call and must never run inside a Prisma transaction. When Route is
    // off (or the merchant has no linked account) we keep the manual reference,
    // preserving the existing flow so production is unaffected until Route is live.
    const preflight = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { merchantProfile: { select: { razorpayLinkedAccountId: true, businessName: true } } },
    });
    if (!preflight) throw new NotFoundException('Payout request not found');
    if (preflight.status !== PayoutRequestStatus.APPROVED) {
      throw new BadRequestException('Payout must be approved before processing');
    }

    const linkedAccountId = preflight.merchantProfile?.razorpayLinkedAccountId ?? null;
    const useRoute = this.razorpay.isRouteEnabled() && Boolean(linkedAccountId);
    let referenceId = `PAY-${Date.now()}-${payoutId.slice(-6)}`;

    if (useRoute) {
      try {
        const transfer = await this.razorpay.createTransfer({
          linkedAccountId: linkedAccountId as string,
          amountRupees: decimalToNumber(preflight.amount),
          referenceId: payoutId,
          notes: { payoutRequestId: payoutId, merchant: preflight.merchantProfile?.businessName ?? '' },
        });
        referenceId = transfer.id;
        this.logger.log(
          { payoutId, transferId: transfer.id, status: transfer.status },
          'Razorpay Route transfer created for payout',
        );
      } catch (err) {
        // Record the failed attempt but leave the payout APPROVED so it can be
        // retried once the cause (KYC, balance) is fixed — no wallet debit, no
        // fake success.
        const message = err instanceof Error ? err.message : 'Route transfer failed';
        await this.prisma.payoutTransaction.create({
          data: {
            payoutRequestId: payoutId,
            amount: preflight.amount,
            status: PayoutTransactionStatus.FAILED,
            failureReason: message.slice(0, 500),
            processedAt: new Date(),
          },
        });
        await this.audit.log({
          actorId: adminUserId,
          action: 'PAYOUT_TRANSFER_FAILED',
          resourceType: 'payout_request',
          resourceId: payoutId,
          metadata: { error: message } as Prisma.InputJsonValue,
        });
        throw new BadRequestException(`Payout transfer failed: ${message}`);
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const request = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
      if (!request) throw new NotFoundException('Payout request not found');
      if (request.status !== PayoutRequestStatus.APPROVED) {
        throw new BadRequestException('Payout must be approved before processing');
      }

      await tx.payoutRequest.update({
        where: { id: payoutId },
        data: { status: PayoutRequestStatus.PROCESSING, processedBy: adminUserId },
      });
      const txn = await tx.payoutTransaction.create({
        data: {
          payoutRequestId: payoutId,
          amount: request.amount,
          status: PayoutTransactionStatus.SUCCESS,
          referenceId,
          processedAt: now,
        },
      });

      await tx.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: PayoutRequestStatus.COMPLETED,
          processedAt: now,
          processedBy: adminUserId,
        },
      });

      await tx.merchantWallet.update({
        where: { merchantProfileId: request.merchantProfileId },
        data: { totalPaidOut: { increment: request.amount } },
      });

      const merchantPayout = await tx.merchantPayout.create({
        data: {
          merchantProfileId: request.merchantProfileId,
          payoutRequestId: payoutId,
          amount: request.amount,
          status: 'COMPLETED',
          referenceId,
          bankSnapshot: request.bankDetailsSnapshot as Prisma.InputJsonValue,
          processedAt: now,
          processedBy: adminUserId,
        },
      });

      const settledEntries = await tx.settlementLedger.findMany({
        where: {
          merchantProfileId: request.merchantProfileId,
          status: SettlementLedgerStatus.SETTLED,
          payoutRequestId: null,
        },
        orderBy: { settledAt: 'asc' },
      });

      let remaining = decimalToNumber(request.amount);
      for (const entry of settledEntries) {
        if (remaining <= 0) break;
        const net = decimalToNumber(entry.netAmount);
        if (net <= remaining) {
          await tx.settlementLedger.update({
            where: { id: entry.id },
            data: { status: SettlementLedgerStatus.PAID_OUT, payoutRequestId: payoutId },
          });
          remaining = roundMoney(remaining - net);
        }
      }

      return { request, txn, referenceId, merchantPayout };
    });

    await this.ledger.recordMerchantPayout(
      result.merchantPayout.id,
      result.request.merchantProfileId,
      decimalToNumber(result.request.amount),
    );
    void this.financeCache.invalidatePayouts();

    await this.audit.log({
      actorId: adminUserId,
      action: 'PAYOUT_PROCESSED',
      resourceType: 'payout_request',
      resourceId: payoutId,
      metadata: {
        referenceId: result.referenceId,
        amount: decimalToNumber(result.request.amount),
      } as Prisma.InputJsonValue,
    });

    return {
      id: payoutId,
      status: PayoutRequestStatus.COMPLETED,
      referenceId: result.referenceId,
      transactionId: result.txn.id,
    };
  }

  async assertMerchantOwnsPayout(userId: string, payoutId: string) {
    const profile = await this.requireMerchantProfile(userId);
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      select: { merchantProfileId: true },
    });
    if (!payout || payout.merchantProfileId !== profile.id) {
      throw new ForbiddenException('Payout not found');
    }
  }
}
