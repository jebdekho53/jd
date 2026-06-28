import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { ProductController } from './product.controller';
import { ProductCsvController } from './product-csv.controller';
import { ProductCsvService } from './product-csv.service';
import { ProductAiController } from './product-ai.controller';
import { ProductAiService } from './product-ai.service';
import { ProductDuplicateService } from './product-duplicate.service';
import { MerchantAiBillingService } from './merchant-ai-billing.service';
import { MerchantAiWalletService } from './merchant-ai-wallet.service';
import { MerchantAiWalletController } from './merchant-ai-wallet.controller';
import { AiProductImageService } from './ai-product-image.service';
import { OpenAiVisionClient } from './openai-vision.client';
import { MerchantModule } from '../merchant/merchant.module';
import { CategoryGovernanceModule } from '../category-governance/category-governance.module';
import { InventoryModule } from '../inventory/inventory.module';
import { UploadModule } from '../upload/upload.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [MerchantModule, CategoryGovernanceModule, InventoryModule, UploadModule, PaymentModule],
  controllers: [ProductController, ProductCsvController, ProductAiController, MerchantAiWalletController],
  providers: [
    ProductService,
    CategoryService,
    ProductCsvService,
    ProductAiService,
    ProductDuplicateService,
    MerchantAiBillingService,
    MerchantAiWalletService,
    AiProductImageService,
    OpenAiVisionClient,
  ],
  exports: [ProductService, CategoryService, ProductCsvService, ProductAiService, ProductDuplicateService, MerchantAiWalletService],
})
export class ProductModule {}
