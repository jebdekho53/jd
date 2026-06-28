import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getConfig } from '../../config/configuration';
import { BuyerStoreService } from './buyer-store.service';
import { BuyerProductService } from './buyer-product.service';
import { BuyerCacheService } from './buyer-cache.service';
import { BuyerController } from './buyer.controller';
import { BuyerProductReviewController } from './buyer-product-review.controller';
import { ProductReviewService } from './product-review.service';
import { BuyerVisibilityService } from './buyer-visibility.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const cfg = getConfig(configService);
        return {
          publicKey: cfg.jwt.publicKey,
          verifyOptions: {
            algorithms: ['RS256'],
            issuer: cfg.jwt.issuer,
            audience: cfg.jwt.audience,
          },
        };
      },
    }),
  ],
  controllers: [BuyerController, BuyerProductReviewController],
  providers: [
    BuyerStoreService,
    BuyerProductService,
    BuyerCacheService,
    BuyerVisibilityService,
    ProductReviewService,
  ],
  exports: [
    BuyerStoreService,
    BuyerProductService,
    BuyerCacheService,
    BuyerVisibilityService,
    ProductReviewService,
  ],
})
export class BuyerModule {}
