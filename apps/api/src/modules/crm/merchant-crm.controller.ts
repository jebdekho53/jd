import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { MerchantCrmService } from './merchant-crm.service';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
@Controller('merchant/crm')
export class MerchantCrmController {
  constructor(private readonly crm: MerchantCrmService) {}

  @Get('customers')
  async customers(@CurrentUser() user: RequestUser, @Query('storeId') storeId?: string) {
    return { success: true, data: await this.crm.getCustomers(user.id, storeId) };
  }
}
