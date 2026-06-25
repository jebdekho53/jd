import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { PurchaseRecommendationService } from './purchase-recommendation.service';
import { ProcurementMarketplaceService } from './procurement-marketplace.service';
import { ProcurementCartService } from './procurement-cart.service';
import { ProcurementOrderService } from './procurement-order.service';
import { ProcurementAnalyticsService } from './procurement-analytics.service';
import {
  AddCartItemDto,
  CreateVendorOrderDto,
  ProcurementQueryDto,
  UpdateCartDto,
} from './dto/procurement.dto';
import { PrismaService } from '../../database/prisma.service';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
@Controller('merchant/procurement')
export class MerchantProcurementController {
  constructor(
    private readonly recommendations: PurchaseRecommendationService,
    private readonly marketplace: ProcurementMarketplaceService,
    private readonly cart: ProcurementCartService,
    private readonly orders: ProcurementOrderService,
    private readonly analytics: ProcurementAnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  private async merchantId(userId: string) {
    const p = await this.prisma.merchantProfile.findUnique({ where: { userId }, select: { id: true } });
    return p?.id;
  }

  @Get('recommendations')
  async getRecommendations(@CurrentUser() user: RequestUser, @Query() query: ProcurementQueryDto) {
    const id = await this.merchantId(user.id);
    return { success: true, data: id ? await this.recommendations.listRecommendations(id, query.storeId) : [] };
  }

  @Get('vendors')
  async vendors(@Query() query: ProcurementQueryDto) {
    return { success: true, data: await this.marketplace.searchVendors(query) };
  }

  @Get('products')
  async products(@Query() query: ProcurementQueryDto) {
    return { success: true, data: await this.marketplace.searchProducts(query) };
  }

  @Get('credit')
  async credit(@CurrentUser() user: RequestUser) {
    const id = await this.merchantId(user.id);
    return { success: true, data: id ? await this.marketplace.getCreditLines(id) : [] };
  }

  @Get('cart')
  async getCart(@CurrentUser() user: RequestUser, @Query() query: ProcurementQueryDto) {
    return { success: true, data: await this.cart.getCart(user.id, query.storeId) };
  }

  @Post('cart')
  async updateCart(@CurrentUser() user: RequestUser, @Body() dto: UpdateCartDto) {
    return { success: true, data: await this.cart.updateCart(user.id, dto) };
  }

  @Post('cart/items')
  async addCartItem(
    @CurrentUser() user: RequestUser,
    @Body() dto: AddCartItemDto,
    @Query() query: ProcurementQueryDto,
  ) {
    return { success: true, data: await this.cart.addItem(user.id, dto, query.storeId) };
  }

  @Post('orders')
  async createOrder(@CurrentUser() user: RequestUser, @Body() dto: CreateVendorOrderDto) {
    return { success: true, data: await this.orders.createOrder(user.id, dto) };
  }

  @Get('orders')
  async listOrders(@CurrentUser() user: RequestUser, @Query() query: ProcurementQueryDto) {
    return { success: true, data: await this.orders.listOrders(user.id, query.storeId) };
  }

  @Get('analytics')
  async getAnalytics(@CurrentUser() user: RequestUser, @Query() query: ProcurementQueryDto) {
    const id = await this.merchantId(user.id);
    return { success: true, data: id ? await this.analytics.getMerchantAnalytics(id, query.storeId) : {} };
  }
}
