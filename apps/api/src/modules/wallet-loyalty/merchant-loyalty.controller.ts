import { Controller, ForbiddenException, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/index';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('merchant / loyalty')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
@Controller('merchant/stores')
export class MerchantLoyaltyController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':storeId/loyalty-analytics')
  @ApiOperation({ summary: 'Loyalty and repeat customer insights' })
  async loyaltyAnalytics(@CurrentUser() user: RequestUser, @Param('storeId') storeId: string) {
    await this.assertStoreOwned(user.id, storeId);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const orders = await this.prisma.order.findMany({
      where: {
        storeId,
        createdAt: { gte: since },
        status: { in: ['DELIVERED', 'COMPLETED'] },
      },
      select: {
        buyerProfileId: true,
        totalAmount: true,
        walletAmountUsed: true,
        rewardPointsUsed: true,
        rewardPointsEarned: true,
        buyerProfile: { include: { wallet: { select: { tier: true, rewardPoints: true } } } },
      },
    });

    const buyerMap = new Map<string, { orders: number; revenue: number; tier: string | null }>();
    for (const o of orders) {
      const cur = buyerMap.get(o.buyerProfileId) ?? {
        orders: 0,
        revenue: 0,
        tier: o.buyerProfile.wallet?.tier ?? null,
      };
      cur.orders += 1;
      cur.revenue += Number(o.totalAmount);
      buyerMap.set(o.buyerProfileId, cur);
    }

    const repeatCustomers = [...buyerMap.values()].filter((b) => b.orders > 1).length;
    const loyaltyMembers = [...buyerMap.values()].filter((b) => b.tier && b.tier !== 'BRONZE').length;
    const walletRedemptions = orders.filter((o) => Number(o.walletAmountUsed) > 0).length;
    const pointsRedemptions = orders.filter((o) => o.rewardPointsUsed > 0).length;
    const loyaltyRevenue = orders
      .filter((o) => o.buyerProfile.wallet && o.buyerProfile.wallet.tier !== 'BRONZE')
      .reduce((s, o) => s + Number(o.totalAmount), 0);

    return {
      success: true,
      data: {
        storeId,
        totalOrders: orders.length,
        uniqueCustomers: buyerMap.size,
        repeatCustomers,
        loyaltyMembers,
        walletRedemptions,
        pointsRedemptions,
        revenueFromLoyaltyUsers: Math.round(loyaltyRevenue * 100) / 100,
        totalRevenue: orders.reduce((s, o) => s + Number(o.totalAmount), 0),
      },
    };
  }

  private async assertStoreOwned(userId: string, storeId: string) {
    const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('Merchant profile not found');
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
    });
    if (!store) throw new ForbiddenException('Store not found');
  }
}
