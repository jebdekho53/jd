import { Body, Controller, Get, Ip, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FoodKitchenStatus, OrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { FoodOrderService } from './food-order.service';
import { MenuService } from './menu.service';
import { MenuOcrService } from './menu-ocr.service';
import { MenuAiService } from './menu-ai.service';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateAddonGroupDto } from './dto/create-addon-group.dto';
import { CreateComboDto } from './dto/create-combo.dto';
import { MerchantService } from '../merchant/merchant.service';

@ApiTags('merchant / restaurant')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/stores/:storeId')
export class MerchantRestaurantController {
  constructor(
    private readonly menu: MenuService,
    private readonly foodOrder: FoodOrderService,
    private readonly menuOcr: MenuOcrService,
    private readonly menuAi: MenuAiService,
    private readonly merchantService: MerchantService,
  ) {}

  private async profileId(userId: string) {
    const p = await this.merchantService.requireMerchantProfile(userId);
    return p.id;
  }

  @Get('menu')
  @Permissions('products:read')
  async getMenu(@CurrentUser() user: RequestUser, @Param('storeId') storeId: string) {
    const data = await this.menu.getMerchantMenu(await this.profileId(user.id), storeId);
    return { success: true, data };
  }

  @Get('menu/categories')
  @Permissions('products:read')
  async listCategories(@CurrentUser() user: RequestUser, @Param('storeId') storeId: string) {
    const data = await this.menu.listCategories(await this.profileId(user.id), storeId);
    return { success: true, data };
  }

  @Post('menu/categories')
  @Permissions('products:write')
  async createCategory(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: CreateMenuCategoryDto,
  ) {
    const data = await this.menu.createCategory(await this.profileId(user.id), storeId, dto);
    return { success: true, data };
  }

  @Post('menu/items')
  @Permissions('products:write')
  async createItem(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    const data = await this.menu.createMenuItem(await this.profileId(user.id), storeId, dto);
    return { success: true, data };
  }

  @Post('menu/addon-groups')
  @Permissions('products:write')
  async createAddonGroup(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: CreateAddonGroupDto,
  ) {
    const data = await this.menu.createAddonGroup(await this.profileId(user.id), storeId, dto);
    return { success: true, data };
  }

  @Post('menu/items/:menuItemId/addon-groups/:groupId')
  @Permissions('products:write')
  async linkAddon(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('menuItemId') menuItemId: string,
    @Param('groupId') groupId: string,
  ) {
    const data = await this.menu.linkAddonGroupToItem(
      await this.profileId(user.id),
      storeId,
      menuItemId,
      groupId,
    );
    return { success: true, data };
  }

  @Post('menu/combos')
  @Permissions('products:write')
  async createCombo(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: CreateComboDto,
  ) {
    const data = await this.menu.createCombo(await this.profileId(user.id), storeId, dto);
    return { success: true, data };
  }

  @Get('kitchen/queue')
  @Permissions('orders:read')
  async kitchenQueue(@CurrentUser() user: RequestUser, @Param('storeId') storeId: string) {
    const data = await this.foodOrder.getKitchenQueue(user.id, storeId);
    return { success: true, data };
  }

  @Patch('kitchen/orders/:orderId/status')
  @Permissions('orders:update_status')
  async updateKitchenStatus(
    @CurrentUser() user: RequestUser,
    @Param('storeId') _storeId: string,
    @Param('orderId') orderId: string,
    @Body('status') status: FoodKitchenStatus,
  ) {
    const data = await this.foodOrder.updateKitchenStatus(user.id, orderId, status);
    return { success: true, data };
  }

  @Get('restaurant/dashboard')
  @Permissions('orders:read')
  async dashboard(@CurrentUser() user: RequestUser, @Param('storeId') storeId: string) {
    const data = await this.foodOrder.getRestaurantDashboard(user.id, storeId);
    return { success: true, data };
  }

  @Post('menu/ocr')
  @Permissions('products:write')
  async uploadMenuOcr(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body('imageUrl') imageUrl: string,
  ) {
    const data = await this.menuOcr.uploadMenuForOcr(await this.profileId(user.id), storeId, imageUrl);
    return { success: true, data };
  }

  @Get('menu/ocr/:jobId')
  @Permissions('products:read')
  async getOcrJob(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('jobId') jobId: string,
  ) {
    const data = await this.menuOcr.getJob(await this.profileId(user.id), storeId, jobId);
    return { success: true, data };
  }

  @Post('menu/ocr/:jobId/publish')
  @Permissions('products:write')
  async publishOcr(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('jobId') jobId: string,
  ) {
    const data = await this.menuOcr.publishDraftMenu(await this.profileId(user.id), storeId, jobId);
    return { success: true, data };
  }

  @Post('menu/ai/dish')
  @Permissions('products:write')
  @ApiOperation({ summary: 'Analyse a dish photo and prefill a menu item draft (free)' })
  async analyzeDish(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body('imageUrl') imageUrl: string,
  ) {
    const data = await this.menuAi.analyzeDishPhoto(await this.profileId(user.id), storeId, imageUrl);
    return { success: true, data };
  }

  @Post('menu/ai/dish/:jobId/confirm')
  @Permissions('products:write')
  @ApiOperation({ summary: 'Create the menu item from an AI draft (charged per item)' })
  async confirmDish(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('jobId') jobId: string,
    @Body() dto: CreateMenuItemDto,
    @Ip() ip: string,
  ) {
    const data = await this.menuAi.createItemFromAnalysis(
      await this.profileId(user.id),
      storeId,
      jobId,
      dto,
      user.id,
      ip,
    );
    return { success: true, data };
  }
}

@ApiTags('merchant / food orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/food-orders')
export class MerchantFoodOrderController {
  constructor(private readonly foodOrder: FoodOrderService) {}

  @Patch(':orderId/accept')
  @Permissions('orders:update_status')
  async accept(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    const data = await this.foodOrder.transitionFoodOrder(
      user.id,
      orderId,
      OrderStatus.MERCHANT_ACCEPTED,
    );
    return { success: true, data };
  }

  @Patch(':orderId/preparing')
  @Permissions('orders:update_status')
  async preparing(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    const data = await this.foodOrder.transitionFoodOrder(user.id, orderId, OrderStatus.PREPARING);
    return { success: true, data };
  }

  @Patch(':orderId/ready')
  @Permissions('orders:update_status')
  async ready(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    const data = await this.foodOrder.transitionFoodOrder(
      user.id,
      orderId,
      OrderStatus.READY_FOR_PICKUP,
    );
    return { success: true, data };
  }
}
