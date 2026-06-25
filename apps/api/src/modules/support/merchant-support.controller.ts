import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupportActorType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { SupportTicketService } from './support-ticket.service';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateTicketDto, ListTicketsQueryDto, ReplyTicketDto } from './dto/support.dto';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
@Controller('merchant/support')
export class MerchantSupportController {
  constructor(
    private readonly tickets: SupportTicketService,
    private readonly kb: KnowledgeBaseService,
  ) {}

  @Get('tickets')
  async list(@CurrentUser() user: RequestUser, @Query() query: ListTicketsQueryDto) {
    return { success: true, data: await this.tickets.listTicketsForUser(user.id, query.page, query.limit) };
  }

  @Post('tickets')
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateTicketDto) {
    const data = await this.tickets.createTicket({
      requesterUserId: user.id,
      actorType: SupportActorType.MERCHANT,
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
    return { success: true, data: await this.tickets.reply(id, user.id, dto.body) };
  }

  @Get('articles')
  async articles(@Query('q') q?: string) {
    return { success: true, data: await this.kb.search(q, undefined, 'MERCHANT') };
  }
}
