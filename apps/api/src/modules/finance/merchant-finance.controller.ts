import { Controller, Get, Header, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { SettlementService } from '../settlement/settlement.service';
import { SettlementBatchService } from './settlement-batch.service';
import { OrderFinancialsService } from './order-financials.service';
import { FinanceExportService } from './finance-export.service';
import { ListFinanceQueryDto } from './dto/finance.dto';
import { PrismaService } from '../../database/prisma.service';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/finance')
export class MerchantFinanceController {
  constructor(
    private readonly settlement: SettlementService,
    private readonly batches: SettlementBatchService,
    private readonly orderFinancials: OrderFinancialsService,
    private readonly exports: FinanceExportService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('overview')
  @Permissions('earnings:read')
  @ApiOperation({ summary: 'Merchant finance dashboard' })
  async overview(@CurrentUser() user: RequestUser) {
    const earnings = await this.settlement.getMerchantEarnings(user.id);
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    const batches = profile
      ? await this.batches.listSettlements(profile.id, 1, 5)
      : { settlements: [], meta: { page: 1, limit: 5, total: 0 } };

    return {
      success: true,
      data: {
        todayEarnings: earnings.recentOrdersRevenue[0]?.netAmount ?? 0,
        wallet: earnings.wallet,
        commissionBreakdown: earnings.commissionBreakdown,
        pendingSettlement: earnings.wallet.pendingBalance,
        paidSettlement: earnings.wallet.totalPaidOut,
        recentOrders: earnings.recentOrdersRevenue,
        settlementBatches: batches.settlements,
        openPayout: earnings.openPayoutRequest,
      },
    };
  }

  @Get('settlements')
  @Permissions('earnings:read')
  async settlements(@CurrentUser() user: RequestUser, @Query() query: ListFinanceQueryDto) {
    const data = await this.settlement.listMerchantSettlements(user.id, query);
    return { success: true, data };
  }

  @Get('payouts')
  @Permissions('earnings:read')
  async payouts(@CurrentUser() user: RequestUser, @Query() query: ListFinanceQueryDto) {
    const data = await this.settlement.listMerchantPayouts(user.id, query);
    return { success: true, data };
  }

  @Get('orders/:orderId')
  @Permissions('earnings:read')
  async orderBreakdown(@Param('orderId') orderId: string) {
    const data = await this.orderFinancials.getOrderFinancials(orderId);
    return { success: true, data };
  }

  @Get('statement')
  @Permissions('earnings:read')
  @Header('Content-Type', 'text/csv')
  async downloadStatement(@CurrentUser() user: RequestUser, @Res() res: Response) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    const csv = await this.exports.exportSettlementsCsv(profile?.id);
    res.setHeader('Content-Disposition', 'attachment; filename=merchant-statement.csv');
    res.send(csv);
  }
}
