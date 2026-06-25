import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { AdminSupplyChainService } from './admin-supply-chain.service';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminSupplyChainController {
  constructor(private readonly supplyChain: AdminSupplyChainService) {}

  @Get('supply-chain')
  @Permissions('settlements:read')
  async dashboard() {
    return { success: true, data: await this.supplyChain.getDashboard() };
  }

  @Get('vendors')
  @Permissions('settlements:read')
  async vendors() {
    return { success: true, data: await this.supplyChain.listVendors() };
  }

  @Get('vendor-orders')
  @Permissions('settlements:read')
  async vendorOrders() {
    return { success: true, data: await this.supplyChain.listVendorOrders() };
  }

  @Get('vendor-settlements')
  @Permissions('settlements:read')
  async vendorSettlements() {
    return { success: true, data: await this.supplyChain.listVendorSettlements() };
  }
}
