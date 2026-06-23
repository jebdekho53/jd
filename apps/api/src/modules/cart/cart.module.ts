import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartCacheService } from './cart-cache.service';
import { CartController } from './cart.controller';

@Module({
  controllers: [CartController],
  providers: [CartService, CartCacheService],
  exports: [CartService],
})
export class CartModule {}
