import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { MerchantAiWalletService } from '../product/merchant-ai-wallet.service';
import { AdminAdjustAiWalletDto } from '../product/dto/merchant-ai-wallet.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/merchant-ai-wallets')
export class AdminMerchantAiWalletController {
  constructor(private readonly wallet: MerchantAiWalletService) {}

  @Get()
  @ApiOperation({ summary: 'List merchant AI wallets' })
  async list(@Query('page') page?: string, @Query('limit') limit?: string) {
    const data = await this.wallet.listWalletsForAdmin(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
    return { success: true, data };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Aggregate AI wallet statistics' })
  async stats() {
    const data = await this.wallet.getWalletStatsForAdmin();
    return { success: true, data };
  }

  @Get(':merchantId')
  @ApiOperation({ summary: 'Merchant AI wallet detail' })
  async detail(@Param('merchantId') merchantId: string) {
    const data = await this.wallet.getWalletForAdmin(merchantId);
    return { success: true, data };
  }

  @Post(':merchantId/adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manual AI wallet balance adjustment' })
  async adjust(
    @CurrentUser() user: RequestUser,
    @Param('merchantId') merchantId: string,
    @Body() dto: AdminAdjustAiWalletDto,
    @Ip() ip: string,
  ) {
    const data = await this.wallet.adminAdjust(
      merchantId,
      dto.amountPaise,
      dto.reason,
      user.id,
      ip,
    );
    return { success: true, data };
  }
}
