import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { MembershipService } from './membership.service';
import { MembershipAnalyticsService } from './membership-analytics.service';

@ApiTags(Tags.BUYERS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('buyer/plus')
export class BuyerPlusController {
  constructor(
    private readonly membership: MembershipService,
    private readonly analytics: MembershipAnalyticsService,
  ) {}

  @Get('plans')
  async plans() {
    return { success: true, data: await this.membership.listPlans() };
  }

  @Post('subscribe')
  async subscribe(@CurrentUser() user: RequestUser, @Body() body: { planId: string; yearly?: boolean }) {
    return { success: true, data: await this.membership.subscribe(user.id, body.planId, body.yearly) };
  }

  @Get('me')
  async me(@CurrentUser() user: RequestUser) {
    const [subscription, savings] = await Promise.all([
      this.membership.getActiveSubscription(user.id),
      this.analytics.getMemberSavings(user.id),
    ]);
    return { success: true, data: { subscription, savings } };
  }
}
