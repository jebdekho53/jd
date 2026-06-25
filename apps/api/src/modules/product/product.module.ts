import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { ProductController } from './product.controller';
import { MerchantModule } from '../merchant/merchant.module';
import { CategoryGovernanceModule } from '../category-governance/category-governance.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [MerchantModule, CategoryGovernanceModule, InventoryModule],
  controllers: [ProductController],
  providers: [ProductService, CategoryService],
  exports: [ProductService, CategoryService],
})
export class ProductModule {}
