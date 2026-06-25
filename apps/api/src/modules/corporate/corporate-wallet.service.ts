import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CorporateWalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(accountId: string) {
    const wallet = await this.prisma.corporateWallet.findUnique({ where: { accountId } });
    return Number(wallet?.balance ?? 0);
  }

  async debit(accountId: string, amount: number) {
    const wallet = await this.prisma.corporateWallet.findUnique({
      where: { accountId },
      include: { account: true },
    });
    if (!wallet) throw new BadRequestException('Corporate wallet not found');

    const balance = Number(wallet.balance);
    const creditAvailable = Number(wallet.account.creditLimit) - balance;
    if (amount > balance + creditAvailable) {
      throw new BadRequestException('Insufficient corporate wallet balance');
    }

    return this.prisma.corporateWallet.update({
      where: { accountId },
      data: { balance: { decrement: amount } },
    });
  }

  async credit(accountId: string, amount: number) {
    return this.prisma.corporateWallet.update({
      where: { accountId },
      data: { balance: { increment: amount } },
    });
  }
}
