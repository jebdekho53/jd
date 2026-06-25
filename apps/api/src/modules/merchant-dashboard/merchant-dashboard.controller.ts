import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { MerchantDashboardService } from './merchant-dashboard.service';
import {
  MerchantDashboardAnalyticsQueryDto,
  MerchantDashboardOrdersQueryDto,
  MerchantDashboardStoreQueryDto,
} from './dto/merchant-dashboard-query.dto';

@ApiTags('merchant / dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/dashboard')
export class MerchantDashboardController {
  constructor(private readonly dashboard: MerchantDashboardService) {}

  @Get('overview')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Business health overview — today vs yesterday' })
  getOverview(@CurrentUser() user: RequestUser, @Query() query: MerchantDashboardStoreQueryDto) {
    return this.dashboard.getOverview(user.id, query).then((data) => ({ success: true, data }));
  }

  @Get('orders')
  @Permissions('orders:read')
  @ApiOperation({ summary: 'Live order queue with status tabs' })
  getOrders(@CurrentUser() user: RequestUser, @Query() query: MerchantDashboardOrdersQueryDto) {
    return this.dashboard.getOrders(user.id, query).then((data) => ({ success: true, data }));
  }

  @Get('inventory')
  @Permissions('products:read')
  @ApiOperation({ summary: 'Inventory health and low-stock alerts' })
  getInventory(@CurrentUser() user: RequestUser, @Query() query: MerchantDashboardStoreQueryDto) {
    return this.dashboard.getInventory(user.id, query).then((data) => ({ success: true, data }));
  }

  @Get('riders')
  @Permissions('orders:read')
  @ApiOperation({ summary: 'Assigned riders and active deliveries' })
  getRiders(@CurrentUser() user: RequestUser, @Query() query: MerchantDashboardStoreQueryDto) {
    return this.dashboard.getRiders(user.id, query).then((data) => ({ success: true, data }));
  }

  @Get('analytics')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Revenue, category, and hourly demand analytics' })
  getAnalytics(
    @CurrentUser() user: RequestUser,
    @Query() query: MerchantDashboardAnalyticsQueryDto,
  ) {
    return this.dashboard.getAnalytics(user.id, query).then((data) => ({ success: true, data }));
  }

  @Get('customers')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Customer insights and recent reviews' })
  getCustomers(@CurrentUser() user: RequestUser, @Query() query: MerchantDashboardStoreQueryDto) {
    return this.dashboard.getCustomers(user.id, query).then((data) => ({ success: true, data }));
  }

  @Get('compliance')
  @Permissions('stores:read')
  @ApiOperation({ summary: 'Store compliance and category approval status' })
  getCompliance(@CurrentUser() user: RequestUser, @Query() query: MerchantDashboardStoreQueryDto) {
    return this.dashboard.getCompliance(user.id, query).then((data) => ({ success: true, data }));
  }

  @Get('notifications')
  @Permissions('orders:read')
  @ApiOperation({ summary: 'Recent alerts — orders, inventory, compliance' })
  getNotifications(
    @CurrentUser() user: RequestUser,
    @Query() query: MerchantDashboardStoreQueryDto,
  ) {
    return this.dashboard.getNotifications(user.id, query).then((data) => ({ success: true, data }));
  }
}
