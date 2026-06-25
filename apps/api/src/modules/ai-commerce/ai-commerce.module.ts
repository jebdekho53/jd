import { Module } from '@nestjs/common';
import { MerchantDashboardModule } from '../merchant-dashboard/merchant-dashboard.module';
import { DemandForecastService } from './demand-forecast.service';
import { InventoryForecastService } from './inventory-forecast.service';
import { DynamicPricingAIService } from './dynamic-pricing-ai.service';
import { HotspotService } from './hotspot.service';
import { AIRecommendationService } from './ai-recommendation.service';
import { AICommerceOrchestratorService } from './ai-commerce-orchestrator.service';
import { AICommerceScheduler } from './ai-commerce.scheduler';
import { MerchantAIController } from './merchant-ai.controller';
import { AdminAICommerceController } from './admin-ai-commerce.controller';

@Module({
  imports: [MerchantDashboardModule],
  controllers: [MerchantAIController, AdminAICommerceController],
  providers: [
    DemandForecastService,
    InventoryForecastService,
    DynamicPricingAIService,
    HotspotService,
    AIRecommendationService,
    AICommerceOrchestratorService,
    AICommerceScheduler,
  ],
  exports: [DemandForecastService, HotspotService, InventoryForecastService],
})
export class AICommerceModule {}
