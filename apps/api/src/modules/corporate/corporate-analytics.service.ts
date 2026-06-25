import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CorporateAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminAnalytics() {
    const [accounts, invoices, wallets] = await Promise.all([
      this.prisma.corporateAccount.findMany({ where: { status: 'ACTIVE' } }),
      this.prisma.corporateInvoice.aggregate({ _sum: { invoiceAmount: true } }),
      this.prisma.corporateWallet.findMany(),
    ]);

    const totalSpend = Number(invoices._sum.invoiceAmount ?? 0);
    const creditLimit = accounts.reduce((s, a) => s + Number(a.creditLimit), 0);
    const utilized = wallets.reduce((s, w) => s + Number(w.balance), 0);

    return {
      activeCompanies: accounts.length,
      totalSpend,
      creditLimit,
      creditUtilization: creditLimit > 0 ? Math.round((utilized / creditLimit) * 100) : 0,
      invoices: await this.prisma.corporateInvoice.count(),
    };
  }

  async getAccountSpend(accountId: string) {
    const requests = await this.prisma.purchaseRequest.findMany({
      where: { employee: { accountId }, status: 'APPROVED' },
    });
    return {
      totalSpend: requests.reduce((s, r) => s + Number(r.amount), 0),
      orderCount: requests.length,
    };
  }
}
