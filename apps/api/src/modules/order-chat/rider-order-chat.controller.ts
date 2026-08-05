import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types/index';
import { OrderChatService } from './order-chat.service';
import { SendOrderChatMessageDto } from './dto/order-chat.dto';

@ApiTags('rider / order chat')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RIDER')
@Controller('rider/orders')
export class RiderOrderChatController {
  constructor(private readonly chat: OrderChatService) {}

  @Get(':orderId/chat')
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'List chat messages with the buyer for this delivery' })
  async list(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Query('after') after?: string,
  ) {
    return { success: true, data: await this.chat.listForRider(user.id, orderId, after) };
  }

  @Post(':orderId/chat')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Send a chat message to the buyer for this delivery' })
  async send(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: SendOrderChatMessageDto,
  ) {
    return { success: true, data: await this.chat.sendAsRider(user.id, orderId, dto.body) };
  }
}
