import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { StorePromotionService } from './store-promotion.service';
import {
  CreateStorePromotionDto,
  ListPromotionsDto,
  UpdateStorePromotionDto,
} from './dto/promotion.dto';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/stores')
export class MerchantPromotionController {
  constructor(private readonly service: StorePromotionService) {}

  @Get(':storeId/promotions/overview')
  @Permissions('stores:read')
  async overview(@CurrentUser() user: RequestUser, @Param('storeId') storeId: string) {
    const data = await this.service.merchantOverview(user.id, storeId);
    return { success: true, data };
  }

  @Get(':storeId/promotions')
  @Permissions('stores:read')
  async list(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Query() dto: ListPromotionsDto,
  ) {
    const result = await this.service.listMerchant(user.id, storeId, dto);
    return {
      success: true,
      data: result.promotions,
      meta: { page: result.page, limit: result.limit, total: result.total },
    };
  }

  @Post(':storeId/promotions')
  @Permissions('stores:update')
  async create(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: CreateStorePromotionDto,
  ) {
    const data = await this.service.create(user.id, storeId, dto);
    return { success: true, data };
  }

  @Patch(':storeId/promotions/:id')
  @Permissions('stores:update')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStorePromotionDto,
  ) {
    const data = await this.service.update(user.id, storeId, id, dto);
    return { success: true, data };
  }

  @Post(':storeId/promotions/:id/pause')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:update')
  async pause(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ) {
    const data = await this.service.pause(user.id, storeId, id);
    return { success: true, data };
  }

  @Post(':storeId/promotions/:id/resume')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:update')
  async resume(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ) {
    const data = await this.service.resume(user.id, storeId, id);
    return { success: true, data };
  }

  @Delete(':storeId/promotions/:id')
  @Permissions('stores:update')
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ) {
    const data = await this.service.remove(user.id, storeId, id);
    return { success: true, data };
  }
}
