import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { FranchiseExpansionMerchantService } from './franchise-expansion-merchant.service';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
@Controller('merchant/growth')
export class MerchantFranchiseExpansionController {
  constructor(private readonly merchantExpansion: FranchiseExpansionMerchantService) {}

  @Get('expansion')
  async getExpansion(@CurrentUser() user: RequestUser, @Query('storeId') storeId?: string) {
    return { success: true, data: await this.merchantExpansion.getExpansionOpportunities(user.id, storeId) };
  }
}
