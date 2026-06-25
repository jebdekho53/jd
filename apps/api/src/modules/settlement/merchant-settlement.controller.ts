import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { SettlementService } from './settlement.service';
import { CreatePayoutRequestDto, ListSettlementsQueryDto } from './dto/settlement.dto';

@ApiTags('merchant / settlements')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant')
export class MerchantSettlementController {
  constructor(private readonly settlement: SettlementService) {}

  @Get('earnings')
  @Permissions('earnings:read')
  @ApiOperation({ summary: 'Wallet balances, commission breakdown, recent revenue' })
  getEarnings(@CurrentUser() user: RequestUser) {
    return this.settlement.getMerchantEarnings(user.id).then((data) => ({ success: true, data }));
  }

  @Get('settlements')
  @Permissions('earnings:read')
  @ApiOperation({ summary: 'Settlement ledger history' })
  listSettlements(@CurrentUser() user: RequestUser, @Query() query: ListSettlementsQueryDto) {
    return this.settlement.listMerchantSettlements(user.id, query).then((data) => ({ success: true, data }));
  }

  @Post('payout-request')
  @Permissions('payouts:request')
  @ApiOperation({ summary: 'Request a payout from available balance' })
  createPayout(@CurrentUser() user: RequestUser, @Body() dto: CreatePayoutRequestDto) {
    return this.settlement.createPayoutRequest(user.id, dto).then((data) => ({ success: true, data }));
  }

  @Get('payouts')
  @Permissions('payouts:read')
  @ApiOperation({ summary: 'Payout request history' })
  listPayouts(@CurrentUser() user: RequestUser, @Query() query: ListSettlementsQueryDto) {
    return this.settlement.listMerchantPayouts(user.id, query).then((data) => ({ success: true, data }));
  }
}
