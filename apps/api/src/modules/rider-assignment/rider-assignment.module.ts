import { Module } from '@nestjs/common';
import { OrderTimelineModule } from '../order/order-timeline.module';
import { AuditModule } from '../audit/audit.module';
import { DomainEventsModule } from '../domain-events/domain-events.module';
import { RiderAssignmentService } from './rider-assignment.service';
import { RiderAssignmentController } from './rider-assignment.controller';
import { RiderAssignmentGateway } from './rider-assignment.gateway';
import { RiderAssignmentScheduler } from './rider-assignment.scheduler';
import { RiderAssignmentCacheService } from './rider-assignment-cache.service';

@Module({
  imports: [OrderTimelineModule, AuditModule, DomainEventsModule],
  controllers: [RiderAssignmentController],
  providers: [
    RiderAssignmentService,
    RiderAssignmentGateway,
    RiderAssignmentScheduler,
    RiderAssignmentCacheService,
  ],
  exports: [RiderAssignmentService, RiderAssignmentCacheService],
})
export class RiderAssignmentModule {}
