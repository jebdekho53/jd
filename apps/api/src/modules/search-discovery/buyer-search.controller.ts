import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { CartService } from '../cart/cart.service';
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
@Controller('buyer/search')
export class BuyerSearchController {
  constructor(
    private readonly discovery: SearchDiscoveryService,
    private readonly analytics: SearchAnalyticsService,
    private readonly cartService: CartService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Unified hyperlocal search (products, stores, categories, brands)' })
  async search(@Query() dto: BuyerSearchDto) {
    const data = await this.discovery.unifiedSearch(dto);
    return { success: true, data };
  }

  @Public()
  @Get('suggestions')
  @ApiOperation({ summary: 'Search autocomplete suggestions' })
  async suggestions(@Query() dto: SearchSuggestionsDto) {
    const data = await this.discovery.suggestions(dto);
    return { success: true, data };
  }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Trending searches (24h / 7d / 30d)' })
  async trending(@Query() dto: SearchTrendingDto) {
    const data = await this.discovery.trending(dto);
    return { success: true, data };
  }

  @Public()
  @Post('events')
  @ApiOperation({ summary: 'Track anonymous search interaction events (session-based)' })
  trackAnonymousEvent(@Body() dto: TrackSearchEventDto) {
    this.analytics.track({
      eventType: dto.eventType as SearchEventType,
      query: dto.query,
      productId: dto.productId,
      storeId: dto.storeId,
      categoryId: dto.categoryId,
      sessionId: dto.sessionId,
    });
    return { success: true };
  }

  @Post('events/me')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  @ApiOperation({ summary: 'Track search events for the authenticated buyer' })
  async trackBuyerEvent(@CurrentUser() user: RequestUser, @Body() dto: TrackSearchEventDto) {
    const buyerProfileId = await this.cartService.getBuyerProfileId(user.id);
    this.analytics.track({
      eventType: dto.eventType as SearchEventType,
      query: dto.query,
      productId: dto.productId,
      storeId: dto.storeId,
      categoryId: dto.categoryId,
      sessionId: dto.sessionId,
      buyerProfileId,
    });
    return { success: true };
  }
}

@ApiTags(Tags.BUYERS)
@Controller('buyer/discover')
export class BuyerDiscoverController {
  constructor(private readonly discovery: SearchDiscoveryService) {}

  @Public()
  @Get('stores')
  @ApiOperation({ summary: 'Discover stores with filters (nearest, rated, fast, offers, new)' })
  async discoverStores(@Query() dto: DiscoverStoresSearchDto) {
    const data = await this.discovery.discoverStores(dto);
    return { success: true, data };
  }

  @Public()
  @Get('home')
  @ApiOperation({ summary: 'Homepage discovery sections (trending, nearby, deals, recommended)' })
  async discoverHome(@Query() dto: DiscoverHomeDto) {
    const data = await this.discovery.discoverHome({
      lat: dto.lat,
      lng: dto.lng,
    });
    return { success: true, data };
  }
}
