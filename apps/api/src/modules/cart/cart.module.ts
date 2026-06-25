import { Module, forwardRef } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartCacheService } from './cart-cache.service';
import { CartController } from './cart.controller';
import { PromotionModule } from '../promotion/promotion.module';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [forwardRef(() => PromotionModule), MembershipModule],
  controllers: [CartController],
  providers: [CartService, CartCacheService],
  exports: [CartService],
})
export class CartModule {}
