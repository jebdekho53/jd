import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { AdminFulfillmentNetworkService } from './admin-fulfillment-network.service';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/fulfillment-network')
export class AdminFulfillmentNetworkController {
  constructor(private readonly admin: AdminFulfillmentNetworkService) {}

  @Get()
  @Permissions('settlements:read')
  async dashboard() {
    return { success: true, data: await this.admin.getDashboard() };
  }

  @Get('transfers')
  @Permissions('settlements:read')
  async transfers() {
    return { success: true, data: await this.admin.listTransfers() };
  }

  @Get('capacity')
  @Permissions('settlements:read')
  async capacity() {
    return { success: true, data: await this.admin.getCapacityHeatmap() };
  }

  @Get('sla')
  @Permissions('settlements:read')
  async sla() {
    return { success: true, data: await this.admin.getSlaMetrics() };
  }
}
