import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { AICommerceOrchestratorService } from './ai-commerce-orchestrator.service';
import { DemandForecastService } from './demand-forecast.service';
import { InventoryForecastService } from './inventory-forecast.service';
import { DynamicPricingAIService } from './dynamic-pricing-ai.service';
import { AIRecommendationService } from './ai-recommendation.service';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/ai')
export class MerchantAIController {
  constructor(
    private readonly merchantDashboard: MerchantDashboardService,
    private readonly orchestrator: AICommerceOrchestratorService,
    private readonly demand: DemandForecastService,
    private readonly inventorySvc: InventoryForecastService,
    private readonly pricing: DynamicPricingAIService,
    private readonly recommendations: AIRecommendationService,
  ) {}

  private async storeIds(userId: string, storeId?: string) {
    const ctx = await this.merchantDashboard.resolveStoreContext(userId, storeId);
    return ctx.storeIds;
  }

  @Get('forecast')
  @Permissions('analytics:read')
  async forecast(@CurrentUser() user: RequestUser, @Query('storeId') storeId?: string) {
    const ids = await this.storeIds(user.id, storeId);
    return { success: true, data: await this.demand.getMerchantForecasts(ids) };
  }

  @Get('inventory')
  @Permissions('analytics:read')
  async inventoryForecast(@CurrentUser() user: RequestUser, @Query('storeId') storeId?: string) {
    const ids = await this.storeIds(user.id, storeId);
    return { success: true, data: await this.inventorySvc.getMerchantInventory(ids) };
  }

  @Get('pricing')
  @Permissions('analytics:read')
  async pricingRecs(@CurrentUser() user: RequestUser, @Query('storeId') storeId?: string) {
    const ids = await this.storeIds(user.id, storeId);
    return { success: true, data: await this.pricing.getMerchantPricing(ids) };
  }

  @Get('opportunities')
  @Permissions('analytics:read')
  async opportunities(@CurrentUser() user: RequestUser, @Query('storeId') storeId?: string) {
    const ids = await this.storeIds(user.id, storeId);
    const data = await this.orchestrator.getMerchantOverview(ids);
    return {
      success: true,
      data: {
        recommendations: data.opportunities,
        hotspots: data.hotspots,
      },
    };
  }
}
