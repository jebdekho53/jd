import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DemandForecastService } from './demand-forecast.service';
import { HotspotService } from './hotspot.service';
import { InventoryForecastService } from './inventory-forecast.service';
import { DynamicPricingAIService } from './dynamic-pricing-ai.service';
import { AIRecommendationService } from './ai-recommendation.service';

@Injectable()
export class AICommerceScheduler {
  private readonly logger = new Logger(AICommerceScheduler.name);

  constructor(
    private readonly demand: DemandForecastService,
    private readonly hotspots: HotspotService,
    private readonly inventory: InventoryForecastService,
    private readonly pricing: DynamicPricingAIService,
    private readonly recommendations: AIRecommendationService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async hourlyJobs() {
    try {
      await this.demand.runAllForecasts();
      await this.hotspots.generateHotspots();
    } catch (err) {
      this.logger.error('Hourly AI commerce jobs failed', err instanceof Error ? err.stack : String(err));
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async dailyJobs() {
    try {
      await this.inventory.runAllForecasts();
      await this.pricing.runAllRecommendations();
      await this.recommendations.generateAll();
    } catch (err) {
      this.logger.error('Daily AI commerce jobs failed', err instanceof Error ? err.stack : String(err));
    }
  }
}
