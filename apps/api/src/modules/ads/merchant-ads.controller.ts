import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { PrismaService } from '../../database/prisma.service';
import { AdAnalyticsService } from './ad-analytics.service';
import { AdCampaignStatus } from '@prisma/client';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/ads')
export class MerchantAdsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adAnalytics: AdAnalyticsService,
  ) {}

  private async advertiserId(userId: string) {
    const mp = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    return mp?.id;
  }

  @Get('campaigns')
  @Permissions('analytics:read')
  async campaigns(@CurrentUser() user: RequestUser) {
    const advertiserId = await this.advertiserId(user.id);
    if (!advertiserId) return { success: true, data: [] };
    const data = await this.prisma.adCampaign.findMany({
      where: { advertiserId },
      include: { sponsoredProducts: true, keywordBids: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data };
  }

  @Post('campaigns')
  @Permissions('products:write')
  async createCampaign(
    @CurrentUser() user: RequestUser,
    @Body() body: { name: string; budget: number; productIds?: string[]; keywords?: Array<{ keyword: string; bidAmount: number }> },
  ) {
    const advertiserId = await this.advertiserId(user.id);
    if (!advertiserId) return { success: false, message: 'Merchant profile required' };

    const campaign = await this.prisma.adCampaign.create({
      data: {
        name: body.name,
        advertiserId,
        budget: body.budget,
        status: AdCampaignStatus.DRAFT,
        adGroups: { create: { bidAmount: 10, dailyBudget: body.budget / 30 } },
        sponsoredProducts: body.productIds?.length
          ? { create: body.productIds.map((productId, i) => ({ productId, priority: body.productIds!.length - i })) }
          : undefined,
        keywordBids: body.keywords?.length
          ? { create: body.keywords.map((k) => ({ keyword: k.keyword, bidAmount: k.bidAmount })) }
          : undefined,
      },
    });
    return { success: true, data: campaign };
  }

  @Get('analytics')
  @Permissions('analytics:read')
  async analytics(@CurrentUser() user: RequestUser) {
    const advertiserId = await this.advertiserId(user.id);
    if (!advertiserId) return { success: true, data: {} };
    return { success: true, data: await this.adAnalytics.getMerchantAnalytics(advertiserId) };
  }
}
