import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { AdminDashboardService } from './admin-dashboard.service';
import {
  AdminDashboardOrdersQueryDto,
  AdminDashboardStoresQueryDto,
} from './dto/admin-dashboard-query.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get('overview')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Platform health overview metrics' })
  getOverview() {
    return this.dashboard.getOverview().then((data) => ({ success: true, data }));
  }

  @Get('orders')
  @Permissions('orders:read')
  @ApiOperation({ summary: 'Live orders command center' })
  getOrders(@Query() query: AdminDashboardOrdersQueryDto) {
    return this.dashboard.getOrders(query).then((data) => ({ success: true, data }));
  }

  @Get('stores')
  @Permissions('stores:approve')
  @ApiOperation({ summary: 'Store governance summary' })
  getStores(@Query() query: AdminDashboardStoresQueryDto) {
    return this.dashboard.getStores(query).then((data) => ({ success: true, data }));
  }

  @Get('riders')
  @Permissions('orders:read')
  @ApiOperation({ summary: 'Rider control center' })
  getRiders() {
    return this.dashboard.getRiders().then((data) => ({ success: true, data }));
  }

  @Get('unassigned-orders')
  @Permissions('orders:read')
  @ApiOperation({ summary: 'Orders waiting for rider assignment' })
  getUnassigned() {
    return this.dashboard.getUnassignedOrders().then((data) => ({ success: true, data }));
  }

  @Get('payments')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Payment monitoring' })
  getPayments() {
    return this.dashboard.getPayments().then((data) => ({ success: true, data }));
  }

  @Get('customers')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Customer monitoring' })
  getCustomers() {
    return this.dashboard.getCustomers().then((data) => ({ success: true, data }));
  }

  @Get('categories')
  @Permissions('categories:read')
  @ApiOperation({ summary: 'Category governance metrics' })
  getCategories() {
    return this.dashboard.getCategories().then((data) => ({ success: true, data }));
  }

  @Get('fraud-risk')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Fraud and risk events' })
  getFraudRisk() {
    return this.dashboard.getFraudRisk().then((data) => ({ success: true, data }));
  }

  @Get('system-health')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Infrastructure health status' })
  getSystemHealth() {
    return this.dashboard.getSystemHealth().then((data) => ({ success: true, data }));
  }
}
