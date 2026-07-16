import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Param, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { OrderService } from './order.service';
import { ListAdminOrdersDto } from './dto/list-orders.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@ApiTags('admin / orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/orders')
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Permissions('orders:manage')
  @ApiOperation({ summary: 'List all orders (admin monitoring)' })
  @ApiResponse({ status: 200, description: 'Paginated order list' })
  async listOrders(@Query() dto: ListAdminOrdersDto) {
    const data = await this.orderService.listAdminOrders(dto);
    return { success: true, data };
  }

  @Get(':orderId')
  @Permissions('orders:manage')
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Get full order detail for admin' })
  async getOrder(@Param('orderId') orderId: string) {
    const data = await this.orderService.getAdminOrder(orderId);
    return { success: true, data };
  }

  @Patch(':orderId/cancel')
  @HttpCode(HttpStatus.OK)
  @Permissions('orders:manage')
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Cancel an order (admin) — refunds a paid order automatically' })
  async cancelOrder(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: CancelOrderDto,
    @Ip() ip: string,
  ) {
    const data = await this.orderService.cancelByAdmin(user.id, orderId, dto, ip);
    return { success: true, data };
  }
}
