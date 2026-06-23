import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { RiderAssignmentService } from './rider-assignment.service';
import { RiderLocationService } from './rider-location.service';
import { RiderController } from './rider.controller';
import { AdminRiderController } from './admin-rider.controller';

@Module({
  controllers: [RiderController, AdminRiderController],
  providers: [DeliveryService, RiderAssignmentService, RiderLocationService],
  exports: [DeliveryService, RiderAssignmentService],
})
export class RiderModule {}
