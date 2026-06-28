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
import { OpenAiVisionClient } from './openai-vision.client';
import { MerchantModule } from '../merchant/merchant.module';
import { CategoryGovernanceModule } from '../category-governance/category-governance.module';
import { InventoryModule } from '../inventory/inventory.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [MerchantModule, CategoryGovernanceModule, InventoryModule, UploadModule],
  controllers: [ProductController, ProductCsvController, ProductAiController],
  providers: [
    ProductService,
    CategoryService,
    ProductCsvService,
    ProductAiService,
    ProductDuplicateService,
    MerchantAiBillingService,
    OpenAiVisionClient,
  ],
  exports: [ProductService, CategoryService, ProductCsvService, ProductAiService, ProductDuplicateService],
})
export class ProductModule {}
