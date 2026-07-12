import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { WhatsAppBroadcastService } from './whatsapp-broadcast.service';
import {
  CreateWhatsAppBroadcastDto,
  ListWhatsAppBroadcastsQueryDto,
} from './dto/whatsapp-broadcast.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/whatsapp/broadcasts')
export class AdminWhatsAppBroadcastController {
  constructor(private readonly broadcasts: WhatsAppBroadcastService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Upload a CSV and start a personalized WhatsApp broadcast (sends in the background)',
  })
  async create(@Body() dto: CreateWhatsAppBroadcastDto, @CurrentUser() user: RequestUser) {
    const data = await this.broadcasts.create(dto, user.id);
    return { success: true, data };
  }

  @Get('templates')
  @ApiOperation({ summary: 'Approved Meta templates, with their body variable count' })
  async templates() {
    const data = await this.broadcasts.listApprovedTemplates();
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List broadcasts, newest first' })
  async list(@Query() query: ListWhatsAppBroadcastsQueryDto) {
    const data = await this.broadcasts.list(query);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Broadcast progress and per-recipient failures' })
  async findOne(@Param('id') id: string) {
    const data = await this.broadcasts.findOne(id);
    return { success: true, data };
  }
}
