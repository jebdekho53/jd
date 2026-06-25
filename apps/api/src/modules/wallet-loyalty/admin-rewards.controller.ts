import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WalletTransactionType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/index';
import { PrismaService } from '../../database/prisma.service';
import { FraudService } from './fraud.service';
import { RewardConfigService } from './reward-config.service';
import { RewardService } from './reward.service';
import { WalletService } from './wallet.service';
import {
  AdminAdjustPointsDto,
  AdminAdjustWalletDto,
  ResolveFraudReviewDto,
  UpdateRewardConfigDto,
} from './dto/wallet-loyalty.dto';

@ApiTags('admin / rewards')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/rewards')
export class AdminRewardsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: RewardConfigService,
    private readonly wallet: WalletService,
    private readonly reward: RewardService,
    private readonly fraud: FraudService,
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'Reward program configuration' })
  async getConfig() {
    const data = await this.config.getRules();
    return { success: true, data };
  }

  @Patch('config/:key')
  @ApiOperation({ summary: 'Update reward program rule' })
  async updateConfig(
    @CurrentUser() user: RequestUser,
    @Param('key') key: string,
    @Body() dto: UpdateRewardConfigDto,
  ) {
    const data = await this.config.updateConfig(key, dto.value, user.id);
    return { success: true, data };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Wallet and loyalty liabilities analytics' })
  async analytics() {
    const [walletAgg, pointsAgg, referralCount, buyers] = await Promise.all([
      this.prisma.buyerWallet.aggregate({ _sum: { balance: true }, _count: true }),
      this.prisma.buyerWallet.aggregate({ _sum: { rewardPoints: true } }),
      this.prisma.referral.count({ where: { status: 'COMPLETED' } }),
      this.prisma.buyerProfile.count(),
    ]);

    const repeatBuyers = await this.prisma.order.groupBy({
      by: ['buyerProfileId'],
      where: { status: { in: ['DELIVERED', 'COMPLETED'] } },
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } },
    });

    const topLoyal = await this.prisma.buyerWallet.findMany({
      orderBy: { lifetimePoints: 'desc' },
      take: 10,
      include: { buyerProfile: { select: { name: true } } },
    });

    return {
      success: true,
      data: {
        walletLiability: Number(walletAgg._sum.balance ?? 0),
        walletHolders: walletAgg._count,
        rewardPointsLiability: pointsAgg._sum.rewardPoints ?? 0,
        completedReferrals: referralCount,
        totalBuyers: buyers,
        repeatPurchaseRate: buyers > 0 ? Math.round((repeatBuyers.length / buyers) * 100) : 0,
        topLoyalCustomers: topLoyal.map((w) => ({
          name: w.buyerProfile.name,
          tier: w.tier,
          lifetimePoints: w.lifetimePoints,
          balance: Number(w.balance),
        })),
      },
    };
  }

  @Get('fraud-reviews')
  @ApiOperation({ summary: 'Pending fraud review queue' })
  async fraudReviews() {
    const data = await this.fraud.listPendingReviews();
    return { success: true, data };
  }

  @Patch('fraud-reviews/:id')
  @ApiOperation({ summary: 'Resolve fraud review' })
  async resolveFraud(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ResolveFraudReviewDto,
  ) {
    const data = await this.fraud.resolveReview(id, user.id, dto.approve);
    return { success: true, data };
  }

  @Post('wallets/:walletId/credit')
  @ApiOperation({ summary: 'Manual wallet credit' })
  async creditWallet(
    @CurrentUser() user: RequestUser,
    @Param('walletId') walletId: string,
    @Body() dto: AdminAdjustWalletDto,
  ) {
    if (dto.amount <= 0) throw new BadRequestException('Amount must be positive');
    await this.prisma.$transaction(async (tx) => {
      await this.wallet.creditWallet(tx, walletId, dto.amount, WalletTransactionType.ADMIN_ADJUSTMENT, {
        description: dto.reason,
        createdBy: user.id,
        idempotencyKey: `admin-credit:${walletId}:${Date.now()}`,
      });
    });
    return { success: true, data: { credited: dto.amount } };
  }

  @Post('wallets/:walletId/debit')
  @ApiOperation({ summary: 'Manual wallet debit' })
  async debitWallet(
    @CurrentUser() user: RequestUser,
    @Param('walletId') walletId: string,
    @Body() dto: AdminAdjustWalletDto,
  ) {
    if (dto.amount <= 0) throw new BadRequestException('Amount must be positive');
    await this.prisma.$transaction(async (tx) => {
      await this.wallet.debitWallet(tx, walletId, dto.amount, {
        description: dto.reason,
        idempotencyKey: `admin-debit:${walletId}:${Date.now()}`,
      });
    });
    return { success: true, data: { debited: dto.amount } };
  }

  @Post('wallets/:walletId/points')
  @ApiOperation({ summary: 'Manual points adjustment' })
  async adjustPoints(
    @CurrentUser() user: RequestUser,
    @Param('walletId') walletId: string,
    @Body() dto: AdminAdjustPointsDto,
  ) {
    const data = await this.reward.adminAdjustPoints(walletId, dto.points, user.id, dto.reason);
    return { success: true, data };
  }
}
