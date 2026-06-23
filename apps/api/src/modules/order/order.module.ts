import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderCacheService } from './order-cache.service';
import { BuyerOrderController } from './buyer-order.controller';
import { MerchantOrderController } from './merchant-order.controller';

@Module({
  controllers: [BuyerOrderController, MerchantOrderController],
  providers: [OrderService, OrderCacheService],
  exports: [OrderService],
})
export class OrderModule {}
