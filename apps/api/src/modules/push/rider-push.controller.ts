import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { PushSubscriptionService } from './push-subscription.service';
import { PushSubscribeDto, PushUnsubscribeDto } from './dto/push-subscribe.dto';

@ApiTags(Tags.RIDERS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RIDER')
@Controller('rider/notifications/push')
export class RiderPushController {
  constructor(private readonly subscriptions: PushSubscriptionService) {}

  @Get('status')
  @ApiOperation({ summary: 'Whether push is configured and this rider is subscribed' })
  async status(@CurrentUser() user: RequestUser) {
    return { success: true, data: await this.subscriptions.getPushStatus(user.id) };
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Register this device to receive delivery offers' })
  async subscribe(@CurrentUser() user: RequestUser, @Body() dto: PushSubscribeDto) {
    const data = await this.subscriptions.subscribe(user.id, dto);
    return { success: true, data: { id: data.id, endpoint: data.endpoint, isActive: data.isActive } };
  }

  @Post('unsubscribe')
  @ApiOperation({ summary: 'Stop delivery offers reaching this device' })
  async unsubscribe(@CurrentUser() user: RequestUser, @Body() dto: PushUnsubscribeDto) {
    const data = await this.subscriptions.unsubscribe(user.id, dto);
    return { success: true, data };
  }
}
