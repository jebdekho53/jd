import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { WhatsAppInboxService } from './whatsapp-inbox.service';
import {
  ListWhatsAppConversationsQueryDto,
  ListWhatsAppMessagesQueryDto,
  SendWhatsAppReplyDto,
} from './dto/whatsapp-inbox.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/whatsapp')
export class AdminWhatsAppController {
  constructor(private readonly inbox: WhatsAppInboxService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List WhatsApp conversations, newest activity first' })
  async listConversations(@Query() query: ListWhatsAppConversationsQueryDto) {
    const data = await this.inbox.listConversations(query);
    return { success: true, data };
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'List messages in a WhatsApp conversation, oldest first' })
  async listMessages(@Param('id') id: string, @Query() query: ListWhatsAppMessagesQueryDto) {
    const data = await this.inbox.listMessages(id, query);
    return { success: true, data };
  }

  @Get('messages/:messageId/media')
  @ApiOperation({ summary: 'Stream the media (image/audio/video/document) attached to a message' })
  async messageMedia(@Param('messageId') messageId: string, @Res() res: Response) {
    const { buffer, contentType, filename } = await this.inbox.getMessageMedia(messageId);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    if (filename) {
      res.setHeader('Content-Disposition', `inline; filename="${filename.replace(/"/g, '')}"`);
    }
    res.send(buffer);
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear the unread counter on a conversation' })
  async markRead(@Param('id') id: string) {
    const data = await this.inbox.markRead(id);
    return { success: true, data };
  }

  @Post('conversations/:id/reply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send a free-form WhatsApp reply (only valid within the 24-hour customer window)',
  })
  async reply(
    @Param('id') id: string,
    @Body() dto: SendWhatsAppReplyDto,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.inbox.reply(id, dto.text, user.id);
    return { success: true, data };
  }
}
