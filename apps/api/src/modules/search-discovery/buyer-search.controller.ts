import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { SearchDiscoveryService } from './search-discovery.service';
import { SearchAnalyticsService } from './search-analytics.service';
import {
  BuyerSearchDto,
  DiscoverHomeDto,
  DiscoverStoresSearchDto,
  SearchSuggestionsDto,
  SearchTrendingDto,
  TrackSearchEventDto,
} from './dto/search-discovery.dto';
import { SearchEventType } from '@prisma/client';

@ApiTags(Tags.BUYERS)
@Public()
@Controller('buyer/search')
export class BuyerSearchController {
  constructor(
    private readonly discovery: SearchDiscoveryService,
    private readonly analytics: SearchAnalyticsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Unified hyperlocal search (products, stores, categories, brands)' })
  async search(@Query() dto: BuyerSearchDto) {
    const data = await this.discovery.unifiedSearch(dto);
    return { success: true, data };
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Search autocomplete suggestions' })
  async suggestions(@Query() dto: SearchSuggestionsDto) {
    const data = await this.discovery.suggestions(dto);
    return { success: true, data };
  }

  @Get('trending')
  @ApiOperation({ summary: 'Trending searches (24h / 7d / 30d)' })
  async trending(@Query() dto: SearchTrendingDto) {
    const data = await this.discovery.trending(dto);
    return { success: true, data };
  }

  @Post('events')
  @ApiOperation({ summary: 'Track search interaction events' })
  trackEvent(@Body() dto: TrackSearchEventDto) {
    this.analytics.track({
      eventType: dto.eventType as SearchEventType,
      query: dto.query,
      productId: dto.productId,
      storeId: dto.storeId,
      categoryId: dto.categoryId,
      sessionId: dto.sessionId,
      buyerProfileId: dto.buyerProfileId,
    });
    return { success: true };
  }
}

@ApiTags(Tags.BUYERS)
@Public()
@Controller('buyer/discover')
export class BuyerDiscoverController {
  constructor(private readonly discovery: SearchDiscoveryService) {}

  @Get('stores')
  @ApiOperation({ summary: 'Discover stores with filters (nearest, rated, fast, offers, new)' })
  async discoverStores(@Query() dto: DiscoverStoresSearchDto) {
    const data = await this.discovery.discoverStores(dto);
    return { success: true, data };
  }

  @Get('home')
  @ApiOperation({ summary: 'Homepage discovery sections (trending, nearby, deals, recommended)' })
  async discoverHome(@Query() dto: DiscoverHomeDto) {
    const data = await this.discovery.discoverHome(dto);
    return { success: true, data };
  }
}
