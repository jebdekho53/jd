import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { CreateCouponDto, ListAdminPromotionsDto } from './dto/promotion.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminPromotionController {
  constructor(private readonly service: StorePromotionService) {}

  @Get('promotions')
  @Permissions('coupons:read')
  @ApiOperation({ summary: 'List all promotions and coupons' })
  async list(@Query() dto: ListAdminPromotionsDto) {
    const result = await this.service.listAdmin(dto);
    return {
      success: true,
      data: { promotions: result.promotions, coupons: result.coupons },
      meta: { page: result.page, limit: result.limit, total: result.total },
    };
  }

  @Get('promotions/analytics')
  @Permissions('coupons:read')
  async analytics() {
    const data = await this.service.getPlatformAnalytics();
    return { success: true, data };
  }

  @Post('promotions/campaigns')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('coupons:write')
  async createCampaign(@CurrentUser() user: RequestUser, @Body() dto: CreateCouponDto) {
    const data = await this.service.createPlatformCoupon(user.id, dto);
    return { success: true, data };
  }

  @Post('promotions/coupons/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @Permissions('coupons:write')
  async suspend(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.service.suspendCoupon(user.id, id);
    return { success: true, data };
  }
}
