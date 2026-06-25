import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupportMessageVisibility, SupportPriority, SupportActorType, SupportTicketStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { SupportTicketService } from './support-ticket.service';
import { SupportAnalyticsService } from './support-analytics.service';
import { CustomerTimelineService } from './customer-timeline.service';
import { KnowledgeBaseService } from './knowledge-base.service';
import {
  AdminListTicketsDto,
  KnowledgeSearchDto,
  ReplyTicketDto,
  ResolveTicketDto,
} from './dto/support.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/support-center')
export class AdminSupportController {
  constructor(
    private readonly tickets: SupportTicketService,
    private readonly analytics: SupportAnalyticsService,
    private readonly timeline: CustomerTimelineService,
    private readonly kb: KnowledgeBaseService,
  ) {}

  @Get('overview')
  @Permissions('settlements:read')
  @ApiOperation({ summary: 'Support analytics dashboard' })
  async overview() {
    return { success: true, data: await this.analytics.getDashboard() };
  }

  @Get('tickets')
  @Permissions('settlements:read')
  async listTickets(@Query() query: AdminListTicketsDto) {
    return { success: true, data: await this.analytics.listAdminTickets(query) };
  }

  @Get('tickets/open')
  @Permissions('settlements:read')
  async open(@Query() query: AdminListTicketsDto) {
    return this.listTickets({ ...query, status: SupportTicketStatus.OPEN });
  }

  @Get('tickets/escalated')
  @Permissions('settlements:read')
  async escalated(@Query() query: AdminListTicketsDto) {
    return this.listTickets({ ...query, status: SupportTicketStatus.ESCALATED });
  }

  @Get('tickets/high-priority')
  @Permissions('settlements:read')
  async highPriority(@Query() query: AdminListTicketsDto) {
    return this.listTickets({ ...query, priority: SupportPriority.HIGH });
  }

  @Get('tickets/finance-related')
  @Permissions('settlements:read')
  async financeRelated(@Query() query: AdminListTicketsDto) {
    return this.listTickets({ ...query, team: 'FINANCE' });
  }

  @Get('tickets/merchant-related')
  @Permissions('settlements:read')
  async merchantRelated(@Query() query: AdminListTicketsDto) {
    return this.listTickets({ ...query, actorType: SupportActorType.MERCHANT });
  }

  @Get('tickets/rider-related')
  @Permissions('settlements:read')
  async riderRelated(@Query() query: AdminListTicketsDto) {
    return this.listTickets({ ...query, actorType: SupportActorType.RIDER });
  }

  @Get('tickets/refund-related')
  @Permissions('settlements:read')
  async refundRelated(@Query() query: AdminListTicketsDto) {
    return this.listTickets({ ...query, refundOnly: true });
  }

  @Get('tickets/:id')
  @Permissions('settlements:read')
  async detail(@Param('id') id: string) {
    const ticket = await this.tickets.getTicketForUser(id, '', true);
    const customerTimeline = await this.timeline.getTimelineForTicket(id);
    return { success: true, data: { ticket, customerTimeline } };
  }

  @Post('tickets/:id/reply')
  @Permissions('settlements:manage')
  async reply(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ReplyTicketDto,
  ) {
    const visibility = dto.visibility ?? SupportMessageVisibility.PUBLIC;
    const data = await this.tickets.reply(id, user.id, dto.body, visibility, true);
    return { success: true, data };
  }

  @Post('tickets/:id/resolve')
  @Permissions('settlements:manage')
  async resolve(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ResolveTicketDto,
  ) {
    const data = await this.tickets.resolveTicket(id, user.id, dto.summary, dto.refundApproved);
    return { success: true, data };
  }

  @Get('knowledge')
  @Permissions('settlements:read')
  async knowledge(@Query() query: KnowledgeSearchDto) {
    return {
      success: true,
      data: await this.kb.search(query.q, query.category, query.audience),
    };
  }
}
