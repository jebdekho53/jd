import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/index';
import { DeliveryTrackingService } from './delivery-tracking.service';

@ApiTags('buyer / tracking')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@Controller('buyer/orders')
export class BuyerTrackingController {
  constructor(private readonly tracking: DeliveryTrackingService) {}

  @Get(':orderId/tracking')
  @ApiOperation({ summary: 'Live delivery tracking for buyer' })
  async getTracking(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    const data = await this.tracking.getBuyerTracking(user.id, orderId);
    return { success: true, data };
  }
}

@ApiTags('merchant / tracking')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
@Controller('merchant/orders')
export class MerchantTrackingController {
  constructor(private readonly tracking: DeliveryTrackingService) {}

  @Get(':orderId/tracking')
  @ApiOperation({ summary: 'Live delivery tracking for merchant' })
  async getTracking(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    const data = await this.tracking.getMerchantTracking(user.id, orderId);
    return { success: true, data };
  }
}

@ApiTags('admin / tracking')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminTrackingController {
  constructor(private readonly tracking: DeliveryTrackingService) {}

  @Get('orders/:orderId/tracking')
  @ApiOperation({ summary: 'Live delivery tracking for admin' })
  async getOrderTracking(@Param('orderId') orderId: string) {
    const data = await this.tracking.getAdminTracking(orderId);
    return { success: true, data };
  }

  @Get('fleet/live')
  @ApiOperation({ summary: 'Live fleet monitoring' })
  async getFleetLive(@Query('status') status?: string) {
    const data = await this.tracking.getFleetLive(status);
    return { success: true, data };
  }

  @Get('fleet/analytics')
  @ApiOperation({ summary: 'Delivery tracking analytics' })
  async getAnalytics() {
    const data = await this.tracking.getAnalytics();
    return { success: true, data };
  }
}
