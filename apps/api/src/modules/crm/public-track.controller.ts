import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MarketingEventType, Prisma } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { MarketingEventService } from './marketing-event.service';
import { TrackEventDto } from './dto/crm.dto';

/**
 * Anonymous, sessionId-keyed reach tracking for the buyer storefront.
 *
 * Public (no auth) so we capture non-logged-in visitors — that is the whole
 * point of "reach". Only low-trust, non-financial event types are accepted;
 * anything that would inflate revenue/orders (ORDER_PLACED, WALLET_*, etc.) is
 * rejected so a scraper can't forge conversions. Rate-limited by the global
 * ThrottlerGuard.
 */
const ALLOWED_EVENTS = new Set<MarketingEventType>([
  MarketingEventType.SEARCH,
  MarketingEventType.VIEW_PRODUCT,
  MarketingEventType.VIEW_STORE,
  MarketingEventType.ADD_CART,
  MarketingEventType.REMOVE_CART,
  MarketingEventType.CHECKOUT_START,
]);

@ApiTags(Tags.BUYERS)
@Controller('track')
export class PublicTrackController {
  constructor(private readonly events: MarketingEventService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Anonymous storefront reach/interaction event' })
  async track(@Body() dto: TrackEventDto) {
    if (!ALLOWED_EVENTS.has(dto.eventType) || !dto.sessionId) {
      return { success: false };
    }
    await this.events.track({
      eventType: dto.eventType,
      sessionId: dto.sessionId,
      storeId: dto.storeId,
      productId: dto.productId,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
    });
    return { success: true };
  }
}
