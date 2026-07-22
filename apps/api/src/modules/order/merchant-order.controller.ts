import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
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
import { OrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types/index';
import { OrderService } from './order.service';
import { ListMerchantOrdersDto } from './dto/list-orders.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { MarkOrderIssueDto } from './dto/mark-issue.dto';

@ApiTags('merchant / orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/orders')
export class MerchantOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Permissions('orders:read')
  @ApiOperation({
    summary: 'Merchant order queue — paginated, filterable by status / store',
  })
  @ApiResponse({ status: 200, description: 'Order queue with pagination' })
  async listOrders(
    @CurrentUser() user: RequestUser,
    @Query() dto: ListMerchantOrdersDto,
  ) {
    const data = await this.orderService.listMerchantOrders(user.id, dto);
    return { success: true, data };
  }

  @Get(':orderId')
  @Permissions('orders:read')
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Get merchant order detail including buyer info and timeline' })
  @ApiResponse({ status: 200, description: 'Order detail' })
  @ApiResponse({ status: 403, description: 'Order does not belong to merchant store' })
  async getOrder(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
  ) {
    const data = await this.orderService.getMerchantOrder(user.id, orderId);
    return { success: true, data };
  }

  @Get(':orderId/pickup-otp')
  @Permissions('orders:read')
  @ApiParam({ name: 'orderId' })
  @ApiOperation({
    summary: 'Get the handover OTP to read out to the rider at pickup',
    description: 'Returned only while a rider is assigned and pickup is not yet verified.',
  })
  @ApiResponse({ status: 200, description: 'Pickup OTP (or null when not yet available)' })
  async getPickupOtp(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
  ) {
    const data = await this.orderService.getMerchantPickupOtp(user.id, orderId);
    return { success: true, data };
  }

  @Patch(':orderId/confirm')
  @Permissions('orders:update_status')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({
    summary: 'Confirm order (PAID → MERCHANT_ACCEPTED)',
    description: 'Transitions a paid order to confirmed. For COD orders already start at MERCHANT_ACCEPTED — use /preparing directly.',
  })
  @ApiResponse({ status: 200, description: 'Order confirmed' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async confirmOrder(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Ip() ip: string,
  ) {
    const data = await this.orderService.advanceMerchantOrder(
      user.id, orderId, OrderStatus.MERCHANT_ACCEPTED, undefined, ip,
    );
    return { success: true, data };
  }

  @Patch(':orderId/preparing')
  @Permissions('orders:update_status')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Mark order as preparing (MERCHANT_ACCEPTED → PREPARING)' })
  @ApiResponse({ status: 200, description: 'Order now PREPARING' })
  async markPreparing(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Ip() ip: string,
  ) {
    const data = await this.orderService.advanceMerchantOrder(
      user.id, orderId, OrderStatus.PREPARING, undefined, ip,
    );
    return { success: true, data };
  }

  @Patch(':orderId/packing')
  @Permissions('orders:update_status')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Start packing (PREPARING → PACKING)' })
  async markPacking(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Ip() ip: string,
  ) {
    const data = await this.orderService.advanceMerchantOrder(
      user.id, orderId, OrderStatus.PACKING, undefined, ip,
    );
    return { success: true, data };
  }

  @Patch(':orderId/ready')
  @Permissions('orders:update_status')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Mark ready for pickup (PACKING → READY_FOR_PICKUP, auto-assign rider)' })
  @ApiResponse({ status: 200, description: 'Order now READY_FOR_PICKUP' })
  async markReady(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Ip() ip: string,
  ) {
    const data = await this.orderService.advanceMerchantOrder(
      user.id, orderId, OrderStatus.READY_FOR_PICKUP, undefined, ip,
    );
    return { success: true, data };
  }

  @Patch(':orderId/out-for-delivery')
  @Permissions('orders:update_status')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({
    summary: 'Self-delivery only: mark out for delivery (READY_FOR_PICKUP → OUT_FOR_DELIVERY)',
    description:
      'Only valid for stores with deliveryMode SELF — no rider/3PL is assigned for these orders, so the merchant reports their own hand-off.',
  })
  @ApiResponse({ status: 200, description: 'Order now OUT_FOR_DELIVERY' })
  @ApiResponse({ status: 400, description: 'Invalid transition (e.g. store is not on self-delivery)' })
  async markOutForDelivery(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Ip() ip: string,
  ) {
    const data = await this.orderService.advanceMerchantOrder(
      user.id, orderId, OrderStatus.OUT_FOR_DELIVERY, undefined, ip,
    );
    return { success: true, data };
  }

  @Patch(':orderId/delivered')
  @Permissions('orders:update_status')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({
    summary: 'Self-delivery only: mark delivered (OUT_FOR_DELIVERY → DELIVERED)',
    description:
      'Only valid for stores with deliveryMode SELF. Runs the same settlement/COD/inventory/rewards/invoice completion used for rider and 3PL deliveries.',
  })
  @ApiResponse({ status: 200, description: 'Order now DELIVERED' })
  @ApiResponse({ status: 400, description: 'Invalid transition (e.g. store is not on self-delivery)' })
  async markDelivered(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Ip() ip: string,
  ) {
    const data = await this.orderService.advanceMerchantOrder(
      user.id, orderId, OrderStatus.DELIVERED, undefined, ip,
    );
    return { success: true, data };
  }

  @Patch(':orderId/cancel')
  @Permissions('orders:update_status')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({
    summary: 'Cancel order (merchant) — allowed before READY_FOR_PICKUP',
    description: 'Paid Razorpay orders will have a refund automatically initiated.',
  })
  @ApiResponse({ status: 200, description: 'Order cancelled by merchant' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled in current status' })
  async cancelOrder(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: CancelOrderDto,
    @Ip() ip: string,
  ) {
    const data = await this.orderService.cancelByMerchant(user.id, orderId, dto, ip);
    return { success: true, data };
  }

  @Patch(':orderId/issue')
  @Permissions('orders:update_status')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Flag an operational issue without changing order status' })
  async markIssue(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: MarkOrderIssueDto,
    @Ip() ip: string,
  ) {
    const data = await this.orderService.markOrderIssue(user.id, orderId, dto.note, ip);
    return { success: true, data };
  }
}
