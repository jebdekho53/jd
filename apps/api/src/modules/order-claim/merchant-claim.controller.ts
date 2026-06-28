import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types/index';
import { OrderClaimService } from './order-claim.service';
import { ListMerchantClaimsDto, PatchMerchantClaimDto } from './dto/order-claim.dto';

@ApiTags('merchant / claims')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/claims')
export class MerchantClaimController {
  constructor(private readonly claims: OrderClaimService) {}

  @Get()
  @Permissions('orders:read')
  @ApiOperation({ summary: 'List return & refund claims for merchant stores' })
  async listClaims(
    @CurrentUser() user: RequestUser,
    @Query() dto: ListMerchantClaimsDto,
  ) {
    const data = await this.claims.listMerchantClaims(user.id, dto);
    return { success: true, data };
  }

  @Get('analytics')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Refund & replacement analytics for merchant' })
  async analytics(
    @CurrentUser() user: RequestUser,
    @Query('storeId') storeId?: string,
  ) {
    const data = await this.claims.getClaimAnalyticsForMerchant(user.id, storeId);
    return { success: true, data };
  }

  @Patch(':claimId')
  @Permissions('orders:write')
  @ApiParam({ name: 'claimId' })
  @ApiOperation({ summary: 'Approve, reject, or action a claim' })
  async patchClaim(
    @CurrentUser() user: RequestUser,
    @Param('claimId') claimId: string,
    @Body() dto: PatchMerchantClaimDto,
  ) {
    const data = await this.claims.patchMerchantClaim(user.id, claimId, dto);
    return { success: true, data };
  }
}
