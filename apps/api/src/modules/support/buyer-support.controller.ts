import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupportActorType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { SupportTicketService } from './support-ticket.service';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateTicketDto, FeedbackDto, ListTicketsQueryDto, ReplyTicketDto } from './dto/support.dto';

@ApiTags(Tags.BUYERS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@Controller('buyer/support')
export class BuyerSupportController {
  constructor(
    private readonly tickets: SupportTicketService,
    private readonly kb: KnowledgeBaseService,
  ) {}

  @Get('categories')
  async categories() {
    return { success: true, data: await this.kb.listCategories('BUYER') };
  }

  @Get('articles')
  async articles(@Query('q') q?: string, @Query('category') category?: string) {
    return { success: true, data: await this.kb.search(q, category, 'BUYER') };
  }

  @Get('tickets')
  async list(@CurrentUser() user: RequestUser, @Query() query: ListTicketsQueryDto) {
    return { success: true, data: await this.tickets.listTicketsForUser(user.id, query.page, query.limit) };
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Create support ticket' })
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateTicketDto) {
    const data = await this.tickets.createTicket({
      requesterUserId: user.id,
      actorType: SupportActorType.BUYER,
      ...dto,
    });
    return { success: true, data };
  }

  @Get('tickets/:id')
  async detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return { success: true, data: await this.tickets.getTicketForUser(id, user.id) };
  }

  @Post('tickets/:id/reply')
  async reply(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ReplyTicketDto) {
    const data = await this.tickets.reply(id, user.id, dto.body);
    return { success: true, data };
  }

  @Post('tickets/:id/feedback')
  async feedback(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: FeedbackDto) {
    const data = await this.tickets.submitFeedback(id, user.id, dto.rating, dto.comment);
    return { success: true, data };
  }
}
