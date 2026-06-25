import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/index';
import { PrismaService } from '../../database/prisma.service';
import { WalletService } from './wallet.service';
import { RewardService } from './reward.service';
import { ReferralService } from './referral.service';
import { ApplyReferralDto } from './dto/wallet-loyalty.dto';

@ApiTags('buyer / wallet')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@Controller('buyer')
export class BuyerWalletController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly reward: RewardService,
    private readonly referral: ReferralService,
  ) {}

  @Get('wallet')
  @ApiOperation({ summary: 'Wallet balance and transactions' })
  async getWallet(@CurrentUser() user: RequestUser) {
    const bp = await this.requireBuyerProfile(user.id);
    const data = await this.wallet.getWalletSummary(bp.id);
    return { success: true, data };
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Reward points, tier and history' })
  async getRewards(@CurrentUser() user: RequestUser) {
    const bp = await this.requireBuyerProfile(user.id);
    const data = await this.reward.getRewardsSummary(bp.id);
    return { success: true, data };
  }

  @Get('referrals')
  @ApiOperation({ summary: 'Referral code and earnings' })
  async getReferrals(@CurrentUser() user: RequestUser) {
    const bp = await this.requireBuyerProfile(user.id);
    const data = await this.referral.getReferralSummary(bp.id);
    return { success: true, data };
  }

  @Post('referrals/apply')
  @ApiOperation({ summary: 'Apply a referral code' })
  async applyReferral(@CurrentUser() user: RequestUser, @Body() dto: ApplyReferralDto) {
    const bp = await this.requireBuyerProfile(user.id);
    const data = await this.referral.applyReferralCode(bp.id, dto.code, dto.deviceFingerprint);
    return { success: true, data };
  }

  private async requireBuyerProfile(userId: string) {
    const bp = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!bp) throw new NotFoundException('Buyer profile not found');
    return bp;
  }
}
