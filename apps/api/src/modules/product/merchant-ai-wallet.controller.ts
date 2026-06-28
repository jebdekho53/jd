import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { MerchantService } from '../merchant/merchant.service';
import { MerchantAiWalletService } from './merchant-ai-wallet.service';
import { CreateAiWalletRechargeDto, VerifyAiWalletRechargeDto } from './dto/merchant-ai-wallet.dto';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/ai-wallet')
export class MerchantAiWalletController {
  constructor(
    private readonly wallet: MerchantAiWalletService,
    private readonly merchantService: MerchantService,
  ) {}

  @Get()
  @Permissions('products:read')
  @ApiOperation({ summary: 'AI wallet balance and transaction history' })
  async getWallet(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const profile = await this.merchantService.requireMerchantProfile(user.id);
    const data = await this.wallet.getWalletSummary(
      profile.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
    return { success: true, data };
  }

  @Post('recharge/create-order')
  @HttpCode(HttpStatus.OK)
  @Permissions('products:write')
  @ApiOperation({ summary: 'Create Razorpay order for AI wallet recharge' })
  async createRechargeOrder(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateAiWalletRechargeDto,
    @Ip() ip: string,
  ) {
    const profile = await this.merchantService.requireMerchantProfile(user.id);
    const data = await this.wallet.createRechargeOrder(profile.id, dto.amountPaise, user.id, ip);
    return { success: true, data };
  }

  @Post('recharge/verify')
  @HttpCode(HttpStatus.OK)
  @Permissions('products:write')
  @ApiOperation({ summary: 'Verify Razorpay payment and credit AI wallet' })
  async verifyRecharge(
    @CurrentUser() user: RequestUser,
    @Body() dto: VerifyAiWalletRechargeDto,
    @Ip() ip: string,
  ) {
    const profile = await this.merchantService.requireMerchantProfile(user.id);
    const data = await this.wallet.verifyRecharge(
      profile.id,
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
      user.id,
      ip,
    );
    return { success: true, data };
  }
}
