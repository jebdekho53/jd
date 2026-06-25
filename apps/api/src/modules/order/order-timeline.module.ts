import { Global, Module } from '@nestjs/common';
import { OrderCacheService } from './order-cache.service';
import { OrderStatusHistoryService } from './order-status-history.service';

/** Shared order cache + status history — imported by checkout, payment, rider, order modules. */
@Global()
@Module({
  providers: [OrderCacheService, OrderStatusHistoryService],
  exports: [OrderCacheService, OrderStatusHistoryService],
})
export class OrderTimelineModule {}
