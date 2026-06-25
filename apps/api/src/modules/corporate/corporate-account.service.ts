import { Injectable } from '@nestjs/common';
import { CorporateAccountStatus, PurchaseRequestStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CorporateAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccountsForUser(userId: string) {
    const links = await this.prisma.corporateUser.findMany({
      where: { userId },
      include: { account: { include: { wallet: true, costCenters: true } } },
    });
    return links.map((l) => ({ ...l.account, role: l.role, corporateUserId: l.id }));
  }

  async createAccount(companyName: string, gstin?: string, creditLimit = 0) {
    return this.prisma.corporateAccount.create({
      data: {
        companyName,
        gstin,
        creditLimit,
        status: CorporateAccountStatus.PENDING,
        wallet: { create: { balance: 0 } },
      },
      include: { wallet: true },
    });
  }

  async addUser(accountId: string, userId: string, role: 'ADMIN' | 'APPROVER' | 'EMPLOYEE') {
    return this.prisma.corporateUser.create({
      data: { accountId, userId, role },
    });
  }
}
