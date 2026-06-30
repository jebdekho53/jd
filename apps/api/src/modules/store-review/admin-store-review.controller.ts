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
import { StoreReviewService } from './store-review.service';
import { ListStoreReviewsDto, ModerateReviewDto } from './dto/store-review.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminStoreReviewController {
  constructor(private readonly service: StoreReviewService) {}

  @Get('reviews')
  @Permissions('stores:read')
  @ApiOperation({ summary: 'List reviews for moderation' })
  async list(
    @Query() dto: ListStoreReviewsDto,
  ) {
    const result = await this.service.listAdminReviews(dto);
    return {
      success: true,
      data: result.reviews,
      meta: { page: result.page, limit: result.limit, total: result.total },
    };
  }

  @Get('reviews/analytics')
  @Permissions('stores:read')
  @ApiOperation({ summary: 'Platform review analytics' })
  async analytics() {
    const data = await this.service.getPlatformAnalytics();
    return { success: true, data };
  }

  @Post('reviews/:id/approve')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:manage')
  async approve(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.service.moderateReview(id, user.id, 'approve');
    return { success: true, data };
  }

  @Post('reviews/:id/hide')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:manage')
  async hide(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
  ) {
    const data = await this.service.moderateReview(id, user.id, 'hide', dto.reason);
    return { success: true, data };
  }

  @Post('reviews/:id/restore')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:manage')
  async restore(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.service.moderateReview(id, user.id, 'restore');
    return { success: true, data };
  }

  @Post('reviews/:id/remove')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:manage')
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
  ) {
    const data = await this.service.moderateReview(id, user.id, 'remove', dto.reason);
    return { success: true, data };
  }
}
