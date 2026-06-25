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
import { ListStoreReviewsDto, MerchantReplyDto } from './dto/store-review.dto';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/stores')
export class MerchantStoreReviewController {
  constructor(private readonly service: StoreReviewService) {}

  @Get(':storeId/reviews/overview')
  @Permissions('stores:read')
  @ApiOperation({ summary: 'Rating overview for merchant review center' })
  async overview(@CurrentUser() user: RequestUser, @Param('storeId') storeId: string) {
    const data = await this.service.getMerchantOverview(user.id, storeId);
    return { success: true, data };
  }

  @Get(':storeId/reviews')
  @Permissions('stores:read')
  @ApiOperation({ summary: 'List store reviews for merchant' })
  async list(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Query() dto: ListStoreReviewsDto,
  ) {
    const result = await this.service.listMerchantReviews(user.id, storeId, dto);
    return {
      success: true,
      data: result.reviews,
      meta: { page: result.page, limit: result.limit, total: result.total },
    };
  }

  @Post(':storeId/reviews/:reviewId/reply')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:update')
  @ApiOperation({ summary: 'Reply to a customer review' })
  async reply(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: MerchantReplyDto,
  ) {
    const data = await this.service.replyToReview(user.id, storeId, reviewId, dto);
    return { success: true, data };
  }
}
