import { Module } from '@nestjs/common';
import { MarketingCardService } from './marketing-card.service';

/**
 * Generates the shareable partner card (PNG). Exported so the franchise and
 * merchant portals (dashboard download) and the email module (welcome-email
 * attachment) can all render the one card from a single source of truth.
 */
@Module({
  providers: [MarketingCardService],
  exports: [MarketingCardService],
})
export class MarketingModule {}
