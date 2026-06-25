import {
  Body,
  Controller,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { StoreReviewService } from './store-review.service';
import {
  CreateStoreReviewDto,
  ListStoreReviewsDto,
  ReportReviewDto,
  UpdateStoreReviewDto,
} from './dto/store-review.dto';

@ApiTags(Tags.BUYERS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@Controller('buyer')
export class BuyerStoreReviewController {
  constructor(private readonly service: StoreReviewService) {}

  @Post('orders/:orderId/review')
  @ApiOperation({ summary: 'Create a verified store review for a delivered order' })
  async create(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: CreateStoreReviewDto,
  ) {
    const data = await this.service.createReview(user.id, orderId, dto);
    return { success: true, data };
  }

  @Get('orders/:orderId/review')
  @ApiOperation({ summary: 'Get review for an order' })
  async get(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    const data = await this.service.getOrderReview(user.id, orderId);
    return { success: true, data };
  }

  @Patch('orders/:orderId/review')
  @ApiOperation({ summary: 'Update an existing review' })
  async update(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateStoreReviewDto,
  ) {
    const data = await this.service.updateReview(user.id, orderId, dto);
    return { success: true, data };
  }

  @Post('reviews/:reviewId/report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Report a review' })
  async report(
    @CurrentUser() user: RequestUser,
    @Param('reviewId') reviewId: string,
    @Body() dto: ReportReviewDto,
  ) {
    const data = await this.service.reportReview(user.id, reviewId, dto);
    return { success: true, data };
  }
}

@Public()
@Controller('buyer/stores')
export class PublicStoreReviewController {
  constructor(private readonly service: StoreReviewService) {}

  @Get(':slug/reviews')
  @ApiOperation({ summary: 'List public store reviews' })
  async list(@Param('slug') slug: string, @Query() dto: ListStoreReviewsDto) {
    const result = await this.service.listPublicStoreReviews(slug, dto);
    return {
      success: true,
      data: result.reviews,
      meta: { page: result.page, limit: result.limit, total: result.total },
    };
  }

  @Get(':slug/reputation')
  @ApiOperation({ summary: 'Get store reputation summary' })
  async reputation(@Param('slug') slug: string) {
    const data = await this.service.getPublicStoreReputation(slug);
    return { success: true, data };
  }
}
