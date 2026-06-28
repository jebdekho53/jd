import { Prisma } from '@prisma/client';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
import { MarketingEventService } from './marketing-event.service';
import { RecommendationService } from './recommendation.service';
import { TrackEventDto, UpdatePreferencesDto } from './dto/crm.dto';

@ApiTags(Tags.BUYERS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@Controller('buyer/crm')
export class BuyerCrmController {
  constructor(
    private readonly notifications: NotificationOrchestratorService,
    private readonly events: MarketingEventService,
    private readonly recommendationService: RecommendationService,
  ) {}

  @Get('preferences')
  async getPreferences(@CurrentUser() user: RequestUser) {
    return { success: true, data: await this.notifications.getPreferences(user.id) };
  }

  @Patch('preferences')
  async updatePreferences(@CurrentUser() user: RequestUser, @Body() dto: UpdatePreferencesDto) {
    return { success: true, data: await this.notifications.updatePreferences(user.id, dto as Record<string, boolean>) };
  }

  @Post('events')
  async trackEvent(@CurrentUser() user: RequestUser, @Body() dto: TrackEventDto) {
    const data = await this.events.track({
      userId: user.id,
      ...dto,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
    });
    return { success: true, data };
  }

  @Get('recommendations')
  async recommendations(
    @CurrentUser() user: RequestUser,
    @Query('type') type: 'product' | 'store' | 'offer' | 'category' = 'product',
  ) {
    return { success: true, data: await this.recommendationService.getRecommendations(user.id, type) };
  }

  @Get('notifications')
  async notificationHistory(@CurrentUser() user: RequestUser, @Query('page') page = 1) {
    return { success: true, data: await this.notifications.listDeliveries(user.id, Number(page)) };
  }

  @Get('inbox')
  async inbox(@CurrentUser() user: RequestUser, @Query('page') page = 1) {
    return { success: true, data: await this.notifications.listInApp(user.id, Number(page)) };
  }

  @Patch('inbox/:id/read')
  async markRead(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.notifications.markInAppRead(user.id, id);
    return { success: true };
  }

  @Patch('inbox/read-all')
  async markAllRead(@CurrentUser() user: RequestUser) {
    await this.notifications.markAllInAppRead(user.id);
    return { success: true };
  }
}
