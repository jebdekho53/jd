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
import { ListMerchantClaimsDto, PatchAdminClaimDto } from './dto/order-claim.dto';

@ApiTags('admin / claims')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN')
@Controller('admin/claims')
export class AdminClaimController {
  constructor(private readonly claims: OrderClaimService) {}

  @Get()
  @Permissions('orders:read')
  @ApiOperation({ summary: 'List all order claims (admin)' })
  async listClaims(@Query() dto: ListMerchantClaimsDto) {
    const data = await this.claims.listAdminClaims(dto);
    return { success: true, data };
  }

  @Patch(':claimId')
  @Permissions('orders:write')
  @ApiParam({ name: 'claimId' })
  @ApiOperation({ summary: 'Admin override on claims — approve, reject, force refund' })
  async patchClaim(
    @CurrentUser() user: RequestUser,
    @Param('claimId') claimId: string,
    @Body() dto: PatchAdminClaimDto,
  ) {
    const data = await this.claims.patchAdminClaim(user.id, claimId, dto);
    return { success: true, data };
  }
}
