import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VerticalBusinessType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { VerticalService } from './vertical.service';
import { RestaurantDiscoveryService } from './restaurant-discovery.service';
import { PrismaService } from '../../database/prisma.service';
import { OrderVertical } from '@prisma/client';

@ApiTags('admin / restaurant')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/restaurant-ops')
export class AdminRestaurantController {
  constructor(
    private readonly vertical: VerticalService,
    private readonly discovery: RestaurantDiscoveryService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('approvals')
  @Permissions('stores:approve')
  @ApiOperation({ summary: 'Stores pending restaurant business type approval' })
  async pendingApprovals(@Query('page') page?: number) {
    const data = await this.prisma.storeBusinessType.findMany({
      where: {
        businessType: { in: ['RESTAURANT', 'CLOUD_KITCHEN', 'CAFE'] as VerticalBusinessType[] },
        status: 'PENDING',
      },
      include: { store: { select: { id: true, name: true, slug: true, status: true } } },
      take: 20,
      skip: ((page ?? 1) - 1) * 20,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data };
  }

  @Post('approvals/:storeId/:businessType/approve')
  @Permissions('stores:approve')
  async approveType(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('businessType') businessType: VerticalBusinessType,
  ) {
    const data = await this.vertical.approveStoreBusinessType(storeId, businessType, user.id);
    return { success: true, data };
  }

  @Post('approvals/:storeId/:businessType/reject')
  @Permissions('stores:approve')
  async rejectType(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('businessType') businessType: VerticalBusinessType,
    @Body('reason') reason: string,
  ) {
    const data = await this.vertical.rejectStoreBusinessType(storeId, businessType, user.id, reason);
    return { success: true, data };
  }

  @Get('cuisines')
  @Permissions('stores:read')
  async listCuisines() {
    const data = await this.discovery.listCuisines();
    return { success: true, data };
  }

  @Get('analytics/food-orders')
  @Permissions('orders:read')
  async foodOrderAnalytics(@Query('days') days?: number) {
    const since = new Date();
    since.setDate(since.getDate() - (days ?? 7));

    const [total, revenue, byStatus] = await Promise.all([
      this.prisma.order.count({
        where: { orderVertical: OrderVertical.FOOD, createdAt: { gte: since } },
      }),
      this.prisma.order.aggregate({
        where: {
          orderVertical: OrderVertical.FOOD,
          status: { in: ['DELIVERED', 'COMPLETED'] },
          createdAt: { gte: since },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { orderVertical: OrderVertical.FOOD, createdAt: { gte: since } },
        _count: true,
      }),
    ]);

    return {
      success: true,
      data: {
        totalOrders: total,
        revenue: Number(revenue._sum.totalAmount ?? 0),
        byStatus,
      },
    };
  }

  @Get('analytics/popular-dishes')
  @Permissions('orders:read')
  async popularDishes(@Query('limit') limit?: number) {
    const data = await this.prisma.foodOrderItem.groupBy({
      by: ['itemName'],
      where: { order: { orderVertical: OrderVertical.FOOD } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit ? Number(limit) : 20,
    });
    return { success: true, data };
  }

  @Get('checkouts/pending-payment')
  @Permissions('orders:read')
  @ApiOperation({ summary: 'Food checkouts awaiting Razorpay completion (admin only)' })
  async pendingFoodCheckouts(@Query('page') page?: number) {
    const take = 20;
    const skip = ((page ?? 1) - 1) * take;
    const [data, total] = await Promise.all([
      this.prisma.foodCheckout.findMany({
        where: { status: 'PENDING', paymentMethod: 'RAZORPAY' },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          buyerProfile: { select: { id: true, name: true, user: { select: { phone: true } } } },
        },
      }),
      this.prisma.foodCheckout.count({
        where: { status: 'PENDING', paymentMethod: 'RAZORPAY' },
      }),
    ]);
    return { success: true, data: { items: data, total, page: page ?? 1 } };
  }

  @Get('orders/overview')
  @Permissions('orders:read')
  @ApiOperation({ summary: 'Food order + shipment status overview for admin ops' })
  async foodOrdersOverview() {
    const [
      pendingPayment,
      paidAwaitingKitchen,
      codActive,
      failed,
      readyForPickup,
      withShipment,
    ] = await Promise.all([
      this.prisma.foodCheckout.count({
        where: { status: 'PENDING', paymentMethod: 'RAZORPAY' },
      }),
      this.prisma.order.count({
        where: { orderVertical: OrderVertical.FOOD, status: 'PAID' },
      }),
      this.prisma.order.count({
        where: {
          orderVertical: OrderVertical.FOOD,
          paymentMethod: 'COD',
          status: { in: ['MERCHANT_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'] },
        },
      }),
      this.prisma.order.count({
        where: {
          orderVertical: OrderVertical.FOOD,
          status: { in: ['PAYMENT_FAILED', 'CANCELLED_BY_BUYER', 'CANCELLED_BY_MERCHANT'] },
        },
      }),
      this.prisma.order.count({
        where: { orderVertical: OrderVertical.FOOD, status: 'READY_FOR_PICKUP' },
      }),
      this.prisma.providerShipment.count({
        where: { order: { orderVertical: OrderVertical.FOOD } },
      }),
    ]);

    return {
      success: true,
      data: {
        pendingOnlineCheckouts: pendingPayment,
        paidAwaitingKitchen,
        codActive,
        failedOrCancelled: failed,
        readyForPickup,
        shadowfaxShipments: withShipment,
      },
    };
  }
}
