import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { ProductReviewService } from './product-review.service';
import { CreateProductReviewDto, ListProductReviewsDto } from './dto/product-review.dto';

@ApiTags(Tags.BUYERS)
@Controller('buyer/products')
export class BuyerProductReviewController {
  constructor(private readonly reviews: ProductReviewService) {}

  @Public()
  @Get(':productId/reviews')
  @ApiOperation({ summary: 'List product reviews with aggregate rating' })
  async list(@Param('productId') productId: string, @Query() dto: ListProductReviewsDto) {
    const data = await this.reviews.listProductReviews(productId, dto);
    return {
      success: true,
      data: data.reviews,
      meta: {
        page: data.page,
        limit: data.limit,
        total: data.total,
        aggregate: data.aggregate,
      },
    };
  }

  @Post(':productId/reviews')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  @ApiOperation({ summary: 'Submit a verified product review' })
  async create(
    @CurrentUser() user: RequestUser,
    @Param('productId') productId: string,
    @Body() dto: CreateProductReviewDto,
  ) {
    const data = await this.reviews.createProductReview(user.id, productId, dto);
    return { success: true, data };
  }
}
