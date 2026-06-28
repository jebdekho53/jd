import { Module, forwardRef } from '@nestjs/common';
import { SupportSlaService } from './support-sla.service';
import { TicketAssignmentService } from './ticket-assignment.service';
import { SupportTicketService } from './support-ticket.service';
import { SupportAutomationService } from './support-automation.service';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CustomerTimelineService } from './customer-timeline.service';
import { SupportAnalyticsService } from './support-analytics.service';
import { MembershipModule } from '../membership/membership.module';
import { PushModule } from '../push/push.module';
import { BuyerSupportController } from './buyer-support.controller';
import { MerchantSupportController } from './merchant-support.controller';
import { RiderSupportController } from './rider-support.controller';
import { AdminSupportController } from './admin-support.controller';

@Module({
  imports: [MembershipModule, forwardRef(() => PushModule)],
  controllers: [
    BuyerSupportController,
    MerchantSupportController,
    RiderSupportController,
    AdminSupportController,
  ],
  providers: [
    SupportSlaService,
    TicketAssignmentService,
    SupportTicketService,
    SupportAutomationService,
    KnowledgeBaseService,
    CustomerTimelineService,
    SupportAnalyticsService,
  ],
  exports: [SupportTicketService, SupportAnalyticsService, KnowledgeBaseService, CustomerTimelineService],
})
export class SupportModule {}
