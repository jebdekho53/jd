import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { SegmentService } from './segment.service';
import { JourneyEngineService } from './journey-engine.service';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
import { CrmAnalyticsService } from './crm-analytics.service';
import { Customer360Service } from './customer-360.service';
import { CreatePushCampaignDto, ListQueryDto } from './dto/crm.dto';
import { PrismaService } from '../../database/prisma.service';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/crm')
export class AdminCrmController {
  constructor(
    private readonly segments: SegmentService,
    private readonly journeys: JourneyEngineService,
    private readonly notifications: NotificationOrchestratorService,
    private readonly analytics: CrmAnalyticsService,
    private readonly customer360: Customer360Service,
    private readonly prisma: PrismaService,
  ) {}

  @Get('overview')
  @Permissions('settlements:read')
  async overview() {
    return { success: true, data: await this.analytics.getDashboard() };
  }

  @Get('segments')
  @Permissions('settlements:read')
  async listSegments() {
    return { success: true, data: await this.segments.listSegments() };
  }

  @Post('segments/:id/refresh')
  @Permissions('settlements:manage')
  async refreshSegment(@Param('id') id: string) {
    const segment = await this.prisma.customerSegment.findUnique({ where: { id } });
    if (!segment) return { success: false };
    const count = await this.segments.refreshSegment(id, segment.kind);
    return { success: true, data: { memberCount: count } };
  }

  @Get('segments/:id/members')
  @Permissions('settlements:read')
  async segmentMembers(@Param('id') id: string, @Query() query: ListQueryDto) {
    return { success: true, data: await this.segments.getSegmentMembers(id, query.page, query.limit) };
  }

  @Get('journeys')
  @Permissions('settlements:read')
  async listJourneys() {
    return { success: true, data: await this.journeys.listJourneys() };
  }

  @Get('campaigns')
  @Permissions('settlements:read')
  async listCampaigns() {
    return { success: true, data: await this.analytics.listCampaigns() };
  }

  @Post('campaigns/push')
  @Permissions('settlements:manage')
  async createPushCampaign(@Body() dto: CreatePushCampaignDto) {
    const campaign = await this.prisma.pushCampaign.create({
      data: {
        name: dto.name,
        segmentId: dto.segmentId,
        templateCode: dto.templateCode,
        status: 'DRAFT',
      },
    });
    return { success: true, data: campaign };
  }

  @Get('templates')
  @Permissions('settlements:read')
  async templates(@Query('category') category?: string) {
    return { success: true, data: await this.notifications.listTemplates(category) };
  }

  @Get('notifications/deliveries')
  @Permissions('settlements:read')
  async deliveries(@Query() query: ListQueryDto) {
    const items = await this.prisma.notificationDelivery.findMany({
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 20),
    });
    return { success: true, data: { items } };
  }

  @Get('customers/:userId')
  @Permissions('settlements:read')
  async customerProfile(@Param('userId') userId: string) {
    return { success: true, data: await this.customer360.getProfile(userId) };
  }

  @Post('campaigns/:type/:id/select-winner')
  @Permissions('settlements:manage')
  async selectWinner(
    @Param('type') type: 'push' | 'email',
    @Param('id') id: string,
  ) {
    const winner = await this.analytics.selectAbWinner(type, id);
    return { success: true, data: { winner } };
  }
}
