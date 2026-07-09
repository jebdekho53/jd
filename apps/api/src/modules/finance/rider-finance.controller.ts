import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { RiderPayoutService } from './rider-payout.service';
import { CodReconciliationService } from './cod-reconciliation.service';
import { CodSubmitDto } from './dto/finance.dto';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('rider / finance')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RIDER')
@Controller('rider/finance')
export class RiderFinanceController {
  constructor(
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
