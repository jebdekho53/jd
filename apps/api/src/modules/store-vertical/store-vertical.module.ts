import { Module } from '@nestjs/common';
import { VerticalService } from './vertical.service';

/** Lightweight module for store business verticals — avoids FoodModule circular imports. */
@Module({
  providers: [VerticalService],
  exports: [VerticalService],
})
export class StoreVerticalModule {}
