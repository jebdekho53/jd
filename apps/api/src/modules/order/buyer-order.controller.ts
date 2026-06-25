import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types/index';
import { OrderService } from './order.service';
import { ListOrdersDto } from './dto/list-orders.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@ApiTags('buyer / orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@Controller('buyer/orders')
export class BuyerOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'List buyer order history (paginated, filterable by status)' })
  @ApiResponse({ status: 200, description: 'Paginated order list' })
  async listOrders(
    @CurrentUser() user: RequestUser,
    @Query() dto: ListOrdersDto,
  ) {
    const data = await this.orderService.listBuyerOrders(user.id, dto);
    return { success: true, data };
  }

  @Get(':orderId')
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Get buyer order detail including timeline and items' })
  @ApiResponse({ status: 200, description: 'Order detail with timeline' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
  ) {
    const data = await this.orderService.getBuyerOrder(user.id, orderId);
    return { success: true, data };
  }

  @Post(':orderId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({
    summary: 'Cancel order (buyer) — only allowed before merchant confirms',
    description: 'Paid Razorpay orders will have a refund automatically initiated.',
  })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled in current status' })
  async cancelOrder(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: CancelOrderDto,
    @Ip() ip: string,
  ) {
    const data = await this.orderService.cancelByBuyer(user.id, orderId, dto, ip);
    return { success: true, data };
  }
}
