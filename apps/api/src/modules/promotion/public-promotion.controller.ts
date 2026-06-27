import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { StorePromotionService } from './store-promotion.service';
import { OfferEngineService } from './offer-engine.service';
import { CampaignAnalyticsService } from './campaign-analytics.service';
import { TrackCampaignEventDto } from './dto/campaign.dto';

@ApiTags(Tags.BUYERS)
@Public()
@Controller('buyer')
export class PublicPromotionController {
  constructor(
    private readonly promotions: StorePromotionService,
    private readonly offers: OfferEngineService,
    private readonly analytics: CampaignAnalyticsService,
  ) {}

  @Get('deals/top')
  @ApiOperation({ summary: 'Top deals across stores' })
  async topDeals() {
    const data = await this.promotions.getTopDeals();
    return { success: true, data };
  }

  @Get('deals/trending')
  async trendingDeals() {
    const data = await this.promotions.getTrendingOffers();
    return { success: true, data };
  }

  @Get('deals/free-delivery')
  async freeDeliveryStores() {
    const data = await this.promotions.getFreeDeliveryStores();
    return { success: true, data };
  }

  @Get('stores/:slug/offers')
  async storeOffers(@Param('slug') slug: string) {
    const data = await this.promotions.listStoreOffers(slug);
    return { success: true, data };
  }

  @Get('stores/:slug/coupons')
  async storeCoupons(@Param('slug') slug: string) {
    const data = await this.promotions.listStoreCoupons(slug);
    return { success: true, data };
  }

  @Get('offers/flash-sales')
  @ApiOperation({ summary: 'Active flash sales with countdown' })
  async flashSales(@Query('limit') limit?: string) {
    const data = await this.offers.getFlashSales(limit ? Number(limit) : 12);
    return { success: true, data };
  }

  @Get('offers/near-you')
  async offersNearYou(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.offers.getOffersNearYou(
      Number(lat),
      Number(lng),
      limit ? Number(limit) : 12,
    );
    return { success: true, data };
  }

  @Post('campaigns/events')
  async trackEvent(@Body() dto: TrackCampaignEventDto) {
    await this.analytics.trackEvent({
      campaignId: dto.campaignId,
      offerId: dto.offerId,
      eventType: dto.eventType,
    });
    return { success: true };
  }
}
