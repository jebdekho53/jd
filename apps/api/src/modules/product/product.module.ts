import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { ProductController } from './product.controller';
import { MerchantModule } from '../merchant/merchant.module';

@Module({
  imports: [MerchantModule],
  controllers: [ProductController],
  providers: [ProductService, CategoryService],
  exports: [ProductService, CategoryService],
})
export class ProductModule {}
