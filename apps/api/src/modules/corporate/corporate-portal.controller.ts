import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { CorporateAccountService } from './corporate-account.service';
import { ApprovalService } from './approval.service';
import { CorporateBillingService } from './corporate-billing.service';
import { CorporateWalletService } from './corporate-wallet.service';
import { PrismaService } from '../../database/prisma.service';

@ApiTags(Tags.BUYERS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('corporate')
export class CorporatePortalController {
  constructor(
    private readonly accounts: CorporateAccountService,
    private readonly approval: ApprovalService,
    private readonly billing: CorporateBillingService,
    private readonly wallet: CorporateWalletService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('accounts')
  async listAccounts(@CurrentUser() user: RequestUser) {
    return { success: true, data: await this.accounts.getAccountsForUser(user.id) };
  }

  @Post('purchase-requests')
  async createRequest(
    @CurrentUser() user: RequestUser,
    @Body() body: { amount: number; notes?: string },
  ) {
    const corpUser = await this.prisma.corporateUser.findFirst({ where: { userId: user.id } });
    if (!corpUser) return { success: false, message: 'Not a corporate user' };
    const data = await this.approval.createPurchaseRequest(corpUser.id, body.amount, body.notes);
    return { success: true, data };
  }

  @Get('invoices')
  async invoices(@CurrentUser() user: RequestUser) {
    const corpUser = await this.prisma.corporateUser.findFirst({ where: { userId: user.id } });
    if (!corpUser) return { success: true, data: [] };
    return { success: true, data: await this.billing.listInvoices(corpUser.accountId) };
  }

  @Get('wallet')
  async walletBalance(@CurrentUser() user: RequestUser) {
    const corpUser = await this.prisma.corporateUser.findFirst({ where: { userId: user.id } });
    if (!corpUser) return { success: true, data: { balance: 0 } };
    return { success: true, data: { balance: await this.wallet.getBalance(corpUser.accountId) } };
  }
}
