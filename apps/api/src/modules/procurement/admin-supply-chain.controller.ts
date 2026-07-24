import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VendorApplicationStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { RequestUser } from '../../common/types';
import { AdminSupplyChainService } from './admin-supply-chain.service';
import { VendorApplicationService } from './vendor-application.service';
import { ApproveVendorApplicationDto, RejectVendorApplicationDto } from './dto/vendor-application.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminSupplyChainController {
  constructor(
    private readonly supplyChain: AdminSupplyChainService,
    private readonly applications: VendorApplicationService,
  ) {}

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

  @Get('vendor-applications')
  @Permissions('settlements:read')
  async vendorApplications(@Query('status') status?: VendorApplicationStatus) {
    return { success: true, data: await this.applications.listApplications(status) };
  }

  @Get('vendor-applications/:id')
  @Permissions('settlements:read')
  async vendorApplication(@Param('id') id: string) {
    return { success: true, data: await this.applications.getApplication(id) };
  }

  @Post('vendor-applications/:id/approve')
  @Permissions('settlements:read')
  async approveVendorApplication(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ApproveVendorApplicationDto,
  ) {
    return { success: true, data: await this.applications.approveApplication(user.id, id, dto) };
  }

  @Post('vendor-applications/:id/reject')
  @Permissions('settlements:read')
  async rejectVendorApplication(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: RejectVendorApplicationDto,
  ) {
    return { success: true, data: await this.applications.rejectApplication(user.id, id, dto) };
  }
}
