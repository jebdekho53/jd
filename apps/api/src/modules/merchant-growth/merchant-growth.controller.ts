import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { MerchantGrowthService } from './merchant-growth.service';
import { GrowthQueryDto } from './dto/growth.dto';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
@Controller('merchant/growth')
export class MerchantGrowthController {
  constructor(private readonly growth: MerchantGrowthService) {}

  @Get('overview')
  async overview(@CurrentUser() user: RequestUser, @Query() query: GrowthQueryDto) {
    return { success: true, data: await this.growth.getOverview(user.id, query.storeId) };
  }

  @Get('recommendations')
  async recommendations(@CurrentUser() user: RequestUser, @Query() query: GrowthQueryDto) {
    return { success: true, data: await this.growth.getRecommendations(user.id, query.storeId) };
  }

  @Get('visibility')
  async visibility(@CurrentUser() user: RequestUser, @Query() query: GrowthQueryDto) {
    return { success: true, data: await this.growth.getVisibility(user.id, query.storeId) };
  }

  @Get('opportunities')
  async opportunities(@CurrentUser() user: RequestUser, @Query() query: GrowthQueryDto) {
    return { success: true, data: await this.growth.getOpportunities(user.id, query.storeId) };
  }

  @Get('benchmark')
  async benchmark(@CurrentUser() user: RequestUser, @Query() query: GrowthQueryDto) {
    return { success: true, data: await this.growth.getBenchmark(user.id, query.storeId) };
  }
}
