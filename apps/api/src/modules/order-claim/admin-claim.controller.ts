import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { ClaimActorType } from '@prisma/client';
import { OrderClaimService } from './order-claim.service';
import { ReturnPickupService } from './return-pickup.service';
import { ListMerchantClaimsDto, PatchAdminClaimDto } from './dto/order-claim.dto';

@ApiTags('admin / claims')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN')
@Controller('admin/claims')
export class AdminClaimController {
  constructor(
    private readonly claims: OrderClaimService,
    private readonly returnPickups: ReturnPickupService,
  ) {}

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

  /** Re-run rider assignment for a return pickup that's still unassigned. */
  @Post(':claimId/return-pickup/reassign')
  @HttpCode(HttpStatus.OK)
  @Permissions('orders:write')
  async reassignPickup(@Param('claimId') claimId: string) {
    await this.returnPickups.reassignByClaim(claimId);
    return { success: true };
  }

  /** Safety valve: mark the returned item received (rider offline) → triggers refund. */
  @Post(':claimId/return-pickup/received')
  @HttpCode(HttpStatus.OK)
  @Permissions('orders:write')
  async markReceived(@CurrentUser() user: RequestUser, @Param('claimId') claimId: string) {
    await this.returnPickups.adminMarkReceived(claimId, user.id);
    return { success: true };
  }

  /** Cancel a scheduled return pickup — the claim reverts to APPROVED. */
  @Post(':claimId/return-pickup/cancel')
  @HttpCode(HttpStatus.OK)
  @Permissions('orders:write')
  async cancelPickup(@CurrentUser() user: RequestUser, @Param('claimId') claimId: string) {
    await this.returnPickups.cancel(claimId, user.id, ClaimActorType.ADMIN);
    return { success: true };
  }
}
