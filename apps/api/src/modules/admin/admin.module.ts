import { Module } from '@nestjs/common';
import { FranchiseStoreLinkService } from '../franchise/franchise-store-link.service';
import { AdminStoreService } from './admin-store.service';
import { AdminStoreController } from './admin-store.controller';
import { AdminMerchantService } from './admin-merchant.service';
import { AdminMerchantController } from './admin-merchant.controller';
import { AdminMediaController } from './admin-media.controller';
import { AdminMediaService } from './admin-media.service';
import { AdminProductController } from './admin-product.controller';
import { AdminProductService } from './admin-product.service';
import { AdminAiProductUsageController } from './admin-ai-product-usage.controller';
import { AdminAiProductUsageService } from './admin-ai-product-usage.service';
import { AdminMerchantAiWalletController } from './admin-merchant-ai-wallet.controller';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';
import { StoreModule } from '../store/store.module';
import { StoreVerticalModule } from '../store-vertical/store-vertical.module';
import { BuyerModule } from '../buyer/buyer.module';
import { MerchantModule } from '../merchant/merchant.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [StoreModule, StoreVerticalModule, BuyerModule, MerchantModule, ProductModule],
  controllers: [
    AdminStoreController,
    AdminMerchantController,
    AdminMediaController,
    AdminProductController,
    AdminAiProductUsageController,
    AdminMerchantAiWalletController,
    AdminUserController,
  ],
  providers: [
    // Provided directly, NOT via FranchiseModule: importing that module here
    // creates a circular module graph. It only needs @Global PrismaService.
    FranchiseStoreLinkService,
    AdminStoreService,
    AdminMerchantService,
    AdminMediaService,
    AdminProductService,
    AdminAiProductUsageService,
    AdminUserService,
  ],
  exports: [
    AdminStoreService,
    AdminMerchantService,
    AdminMediaService,
    AdminProductService,
    AdminAiProductUsageService,
    AdminUserService,
  ],
})
export class AdminModule {}
