import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StepUpGuard } from '../../common/guards/step-up.guard';
import { RequireStepUp } from '../../common/decorators/require-step-up.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RiderBankAccountService } from './rider-bank-account.service';
import { SaveRiderBankAccountDto } from './dto/finance.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { RiderPayoutService } from './rider-payout.service';
import { CodReconciliationService } from './cod-reconciliation.service';
import { CodSubmitDto, RiderEarningsHistoryQueryDto } from './dto/finance.dto';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('rider / finance')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RIDER')
@Controller('rider/finance')
export class RiderFinanceController {
  constructor(
    private readonly bankAccounts: RiderBankAccountService,
    private readonly payouts: RiderPayoutService,
    private readonly cod: CodReconciliationService,
    private readonly prisma: PrismaService,
  ) {}

  private async riderProfileId(userId: string) {
    const p = await this.prisma.riderProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return p?.id ?? '';
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Daily/weekly earnings and payout status' })
  async earnings(@CurrentUser() user: RequestUser) {
    const riderProfileId = await this.riderProfileId(user.id);
    const data = await this.payouts.getRiderEarnings(riderProfileId);
    return { success: true, data };
  }

  @Get('earnings/history')
  @ApiOperation({ summary: 'Paginated, date-filterable completed-delivery earnings history' })
  async earningsHistory(@CurrentUser() user: RequestUser, @Query() query: RiderEarningsHistoryQueryDto) {
    const riderProfileId = await this.riderProfileId(user.id);
    const data = await this.payouts.getRiderEarningsHistory(riderProfileId, query);
    return { success: true, data };
  }

  @Get('bank-account')
  async getBankAccount(@CurrentUser() user: RequestUser) {
    const riderProfileId = await this.riderProfileId(user.id);
    return { success: true, data: await this.bankAccounts.get(riderProfileId) };
  }

  @Put('bank-account')
  @UseGuards(RolesGuard, StepUpGuard)
  @RequireStepUp()
  @ApiOperation({ summary: 'Update payout bank/UPI details — requires a fresh OTP step-up' })
  async saveBankAccount(@CurrentUser() user: RequestUser, @Body() dto: SaveRiderBankAccountDto) {
    const riderProfileId = await this.riderProfileId(user.id);
    return { success: true, data: await this.bankAccounts.save(riderProfileId, dto) };
  }

  @Get('cod/pending')
  @ApiOperation({ summary: 'COD cash the rider still needs to deposit' })
  async pendingCod(@CurrentUser() user: RequestUser) {
    const riderProfileId = await this.riderProfileId(user.id);
    const data = await this.cod.getRiderPendingCod(riderProfileId);
    return { success: true, data };
  }

  @Post('cod/submit')
  async submitCod(@CurrentUser() user: RequestUser, @Body() dto: CodSubmitDto) {
    const riderProfileId = await this.riderProfileId(user.id);
    const data = await this.cod.submitRemittance(riderProfileId, dto);
    return { success: true, data };
  }
}
