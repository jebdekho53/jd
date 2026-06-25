import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipBenefitService } from './membership-benefit.service';
import { MembershipAnalyticsService } from './membership-analytics.service';
import { BuyerPlusController } from './buyer-plus.controller';
import { AdminMembershipController, AdminMembershipAnalyticsController } from './admin-membership.controller';

@Module({
  controllers: [BuyerPlusController, AdminMembershipController, AdminMembershipAnalyticsController],
  providers: [MembershipService, MembershipBenefitService, MembershipAnalyticsService],
  exports: [MembershipService, MembershipBenefitService, MembershipAnalyticsService],
})
export class MembershipModule {}
