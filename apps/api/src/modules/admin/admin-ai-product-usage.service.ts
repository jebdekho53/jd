import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AIProductAnalysisStatus,
  MerchantAiWalletTransactionStatus,
  MerchantAiWalletTransactionType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MerchantAiWalletService } from '../product/merchant-ai-wallet.service';

export interface AdminAiUsageFilters {
  status?: AIProductAnalysisStatus;
  merchantProfileId?: string;
  storeId?: string;
  lowConfidence?: boolean;
  charged?: boolean;
  failed?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class AdminAiProductUsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiWallet: MerchantAiWalletService,
  ) {}

  private buildWhere(filters: AdminAiUsageFilters): Prisma.AIProductAnalysisWhereInput {
    const where: Prisma.AIProductAnalysisWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.merchantProfileId) where.merchantProfileId = filters.merchantProfileId;
    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.lowConfidence) where.confidence = { lt: 0.55 };
    if (filters.charged) where.chargedAt = { not: null };
    if (filters.failed) where.status = AIProductAnalysisStatus.FAILED;
    return where;
  }

  async getStats(filters: AdminAiUsageFilters = {}) {
    const where = this.buildWhere(filters);

    const [
      totalAnalyses,
      confirmedProducts,
      failedAnalyses,
      refundCount,
      revenueAgg,
      refundAgg,
      merchantGroups,
    ] = await Promise.all([
      this.prisma.aIProductAnalysis.count({ where }),
      this.prisma.aIProductAnalysis.count({
        where: { ...where, status: AIProductAnalysisStatus.CONFIRMED },
      }),
      this.prisma.aIProductAnalysis.count({
        where: { ...where, status: AIProductAnalysisStatus.FAILED },
      }),
      this.prisma.merchantAiWalletTransaction.count({
        where: {
          type: MerchantAiWalletTransactionType.REFUND,
          ...(filters.merchantProfileId ? { merchantProfileId: filters.merchantProfileId } : {}),
          ...(filters.storeId ? { storeId: filters.storeId } : {}),
        },
      }),
      this.prisma.merchantAiWalletTransaction.aggregate({
        where: {
          type: MerchantAiWalletTransactionType.DEBIT,
          status: MerchantAiWalletTransactionStatus.SUCCESS,
          ...(filters.merchantProfileId ? { merchantProfileId: filters.merchantProfileId } : {}),
          ...(filters.storeId ? { storeId: filters.storeId } : {}),
        },
        _sum: { amountPaise: true },
        _count: true,
      }),
      this.prisma.merchantAiWalletTransaction.aggregate({
        where: {
          type: MerchantAiWalletTransactionType.REFUND,
          status: MerchantAiWalletTransactionStatus.REFUNDED,
          ...(filters.merchantProfileId ? { merchantProfileId: filters.merchantProfileId } : {}),
          ...(filters.storeId ? { storeId: filters.storeId } : {}),
        },
        _sum: { amountPaise: true },
      }),
      this.prisma.aIProductAnalysis.groupBy({
        by: ['merchantProfileId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
    ]);

    const merchantIds = merchantGroups.map((g) => g.merchantProfileId);
    const merchants = merchantIds.length
      ? await this.prisma.merchantProfile.findMany({
          where: { id: { in: merchantIds } },
          select: { id: true, businessName: true },
        })
      : [];
    const merchantNameMap = new Map(merchants.map((m) => [m.id, m.businessName]));

    const merchantWise = merchantGroups.map((g) => ({
      merchantProfileId: g.merchantProfileId,
      businessName: merchantNameMap.get(g.merchantProfileId) ?? 'Unknown',
      analysisCount: g._count.id,
    }));

    const grossPaise = revenueAgg._sum.amountPaise ?? 0;
    const refundedPaise = refundAgg._sum.amountPaise ?? 0;
    const netPaise = Math.max(0, grossPaise - refundedPaise);
    const walletStats = await this.aiWallet.getWalletStatsForAdmin();

    return {
      totalAnalyses,
      confirmedProducts,
      failedAnalyses,
      refunds: refundCount,
      totalAiRevenuePaise: netPaise,
      totalAiRevenueRupee: netPaise / 100,
      grossAiRevenuePaise: grossPaise,
      refundedAiRevenuePaise: refundedPaise,
      successfulCharges: revenueAgg._count,
      merchantWise,
      wallet: walletStats,
    };
  }

  async list(filters: AdminAiUsageFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const where = this.buildWhere(filters);

    const [items, total, stats] = await Promise.all([
      this.prisma.aIProductAnalysis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          merchantProfile: {
            select: { id: true, businessName: true, user: { select: { phone: true, email: true } } },
          },
          store: { select: { id: true, name: true } },
          createdProduct: { select: { id: true, name: true, slug: true } },
          creditTransactions: {
            where: { type: 'DEBIT' },
            select: { id: true, amountPaise: true, status: true, createdAt: true },
            take: 1,
          },
        },
      }),
      this.prisma.aIProductAnalysis.count({ where }),
      this.getStats(filters),
    ]);

    return {
      stats,
      items: items.map((a) => ({
        id: a.id,
        merchant: {
          id: a.merchantProfile.id,
          businessName: a.merchantProfile.businessName,
          phone: a.merchantProfile.user.phone,
          email: a.merchantProfile.user.email,
        },
        store: a.store,
        uploadedImageUrl: a.uploadedImageUrl,
        confidence: a.confidence,
        status: a.status,
        chargeAmountPaise: a.chargeAmountPaise,
        chargedAt: a.chargedAt,
        createdProduct: a.createdProduct,
        errorMessage: a.errorMessage,
        createdAt: a.createdAt,
        debitTransaction: a.creditTransactions[0] ?? null,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async exportCsv(filters: AdminAiUsageFilters = {}): Promise<string> {
    const where = this.buildWhere(filters);
    const items = await this.prisma.aIProductAnalysis.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5000,
      include: {
        merchantProfile: { select: { businessName: true } },
        store: { select: { name: true } },
        createdProduct: { select: { name: true } },
      },
    });

    const header =
      'id,merchant,store,confidence,status,chargeAmountPaise,chargedAt,productName,errorMessage,createdAt';
    const lines = items.map((a) =>
      [
        a.id,
        escape(a.merchantProfile.businessName),
        escape(a.store.name),
        a.confidence ?? '',
        a.status,
        a.chargeAmountPaise,
        a.chargedAt?.toISOString() ?? '',
        escape(a.createdProduct?.name ?? ''),
        escape(a.errorMessage ?? ''),
        a.createdAt.toISOString(),
      ].join(','),
    );
    return [header, ...lines].join('\n');
  }

  async getDetail(analysisId: string) {
    const analysis = await this.prisma.aIProductAnalysis.findUnique({
      where: { id: analysisId },
      include: {
        merchantProfile: {
          select: { id: true, businessName: true, user: { select: { phone: true, email: true } } },
        },
        store: { select: { id: true, name: true } },
        createdProduct: { select: { id: true, name: true, slug: true, isActive: true } },
        walletTransactions: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!analysis) throw new NotFoundException('Analysis not found');

    return {
      id: analysis.id,
      merchant: analysis.merchantProfile,
      store: analysis.store,
      uploadedImageUrl: analysis.uploadedImageUrl,
      extractedJson: analysis.extractedJson,
      confidence: analysis.confidence,
      status: analysis.status,
      chargeAmountPaise: analysis.chargeAmountPaise,
      chargedAt: analysis.chargedAt,
      createdProduct: analysis.createdProduct,
      errorMessage: analysis.errorMessage,
      transactions: analysis.walletTransactions,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
    };
  }
}

function escape(value: string): string {
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
