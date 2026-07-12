import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { SettlementService } from './settlement.service';
import { ListSettlementsQueryDto, RejectPayoutRequestDto } from './dto/settlement.dto';
import { LinkRouteAccountDto } from './dto/link-route-account.dto';

@ApiTags('admin / settlements')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminSettlementController {
  constructor(private readonly settlement: SettlementService) {}

  @Get('settlements')
  @Permissions('settlements:read')
  @ApiOperation({ summary: 'Platform settlement overview, wallets, ledger' })
  getOverview() {
    return this.settlement.getAdminSettlementsOverview().then((data) => ({ success: true, data }));
  }

  @Get('payout-requests')
  @Permissions('settlements:read')
  @ApiOperation({ summary: 'List merchant payout requests' })
  listPayoutRequests(@Query() query: ListSettlementsQueryDto) {
    return this.settlement.listAdminPayoutRequests(query).then((data) => ({ success: true, data }));
  }

  @Post('payout-requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  @Permissions('settlements:manage')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Approve payout request and reserve balance' })
  approve(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.settlement.approvePayoutRequest(user.id, id).then((data) => ({ success: true, data }));
  }

  @Post('payout-requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  @Permissions('settlements:manage')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Reject payout request' })
  reject(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: RejectPayoutRequestDto,
  ) {
    return this.settlement.rejectPayoutRequest(user.id, id, dto).then((data) => ({ success: true, data }));
  }

  @Post('payout-requests/:id/process')
  @HttpCode(HttpStatus.OK)
  @Permissions('settlements:manage')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Process approved payout (Razorpay Route transfer when enabled, else manual)' })
  process(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.settlement.processPayoutRequest(user.id, id).then((data) => ({ success: true, data }));
  }

  @Post('merchants/:merchantProfileId/route-account')
  @HttpCode(HttpStatus.OK)
  @Permissions('settlements:manage')
  @ApiParam({ name: 'merchantProfileId' })
  @ApiOperation({ summary: 'Create or attach a Razorpay Route linked account for a merchant' })
  linkRouteAccount(
    @CurrentUser() user: RequestUser,
    @Param('merchantProfileId') merchantProfileId: string,
    @Body() dto: LinkRouteAccountDto,
  ) {
    return this.settlement
      .linkMerchantRouteAccount(user.id, merchantProfileId, dto.accountId)
      .then((data) => ({ success: true, data }));
  }
}
