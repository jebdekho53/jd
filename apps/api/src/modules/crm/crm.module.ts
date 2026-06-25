import { Module } from '@nestjs/common';
import { SupportModule } from '../support/support.module';
import { SegmentService } from './segment.service';
import { Customer360Service } from './customer-360.service';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
import { JourneyEngineService } from './journey-engine.service';
import { CartRecoveryService } from './cart-recovery.service';
import { MarketingEventService } from './marketing-event.service';
import { RecommendationService } from './recommendation.service';
import { CrmAnalyticsService } from './crm-analytics.service';
import { MerchantCrmService } from './merchant-crm.service';
import { AdminCrmController } from './admin-crm.controller';
import { BuyerCrmController } from './buyer-crm.controller';
import { MerchantCrmController } from './merchant-crm.controller';

@Module({
  imports: [SupportModule],
  controllers: [AdminCrmController, BuyerCrmController, MerchantCrmController],
  providers: [
    SegmentService,
    Customer360Service,
    NotificationOrchestratorService,
    JourneyEngineService,
    CartRecoveryService,
    MarketingEventService,
    RecommendationService,
    CrmAnalyticsService,
    MerchantCrmService,
  ],
  exports: [MarketingEventService, NotificationOrchestratorService, SegmentService],
})
export class CrmModule {}
