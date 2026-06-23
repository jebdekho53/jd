import { Module } from '@nestjs/common';
import { AdminStoreService } from './admin-store.service';
import { AdminStoreController } from './admin-store.controller';
import { StoreModule } from '../store/store.module';
import { BuyerModule } from '../buyer/buyer.module';

@Module({
  imports: [StoreModule, BuyerModule],
  controllers: [AdminStoreController],
  providers: [AdminStoreService],
  exports: [AdminStoreService],
})
export class AdminModule {}
