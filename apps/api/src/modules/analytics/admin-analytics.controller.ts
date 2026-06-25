import { Controller, Get, Param, Patch, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { AnalyticsService } from './analytics.service';
import { AnalyticsExportQueryDto, AnalyticsSalesQueryDto } from './dto/analytics-query.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('executive')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Executive BI dashboard KPIs (snapshot-backed)' })
  getExecutive() {
    return this.analytics.getExecutive().then((data) => ({ success: true, data }));
  }

  @Get('sales')
  @Permissions('analytics:read')
  getSales(@Query() query: AnalyticsSalesQueryDto) {
    return this.analytics
      .getSales(query.granularity ?? 'daily', query.compare)
      .then((data) => ({ success: true, data }));
  }

  @Get('orders')
  @Permissions('analytics:read')
  getOrders() {
    return this.analytics.getOrders().then((data) => ({ success: true, data }));
  }

  @Get('customers')
  @Permissions('analytics:read')
  getCustomers() {
    return this.analytics.getCustomers().then((data) => ({ success: true, data }));
  }

  @Get('merchants')
  @Permissions('analytics:read')
  getMerchants() {
    return this.analytics.getMerchants().then((data) => ({ success: true, data }));
  }

  @Get('riders')
  @Permissions('analytics:read')
  getRiders() {
    return this.analytics.getRiders().then((data) => ({ success: true, data }));
  }

  @Get('geo')
  @Permissions('analytics:read')
  getGeo() {
    return this.analytics.getGeo().then((data) => ({ success: true, data }));
  }

  @Get('inventory')
  @Permissions('analytics:read')
  getInventory() {
    return this.analytics.getInventory().then((data) => ({ success: true, data }));
  }

  @Get('wallet-rewards')
  @Permissions('analytics:read')
  getWalletRewards() {
    return this.analytics.getWalletRewards().then((data) => ({ success: true, data }));
  }

  @Get('funnel')
  @Permissions('analytics:read')
  getFunnel() {
    return this.analytics.getFunnel().then((data) => ({ success: true, data }));
  }

  @Get('alerts')
  @Permissions('analytics:read')
  getAlerts() {
    return this.analytics.getAlerts().then((data) => ({ success: true, data }));
  }

  @Patch('alerts/:id/acknowledge')
  @Permissions('analytics:read')
  acknowledge(@Param('id') id: string) {
    return this.analytics.acknowledgeAlert(id).then((data) => ({ success: true, data }));
  }

  @Get('export')
  @Permissions('analytics:read')
  async export(@Query() query: AnalyticsExportQueryDto, @Res() res: Response) {
    const result = await this.analytics.exportData(
      query.format ?? 'csv',
      query.range ?? '7d',
      query.type ?? 'executive',
      query.from,
      query.to,
    );
    res.setHeader('Content-Type', result.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  }

  @Get('control-room')
  @Permissions('analytics:read')
  getControlRoom() {
    return this.analytics.getControlRoom().then((data) => ({ success: true, data }));
  }
}
