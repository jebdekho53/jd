import { Module } from '@nestjs/common';
import { DeliveryCoverageService } from './delivery-coverage.service';
import { MerchantDeliveryCoverageController } from './merchant-delivery-coverage.controller';
import { AdminDeliveryCoverageController } from './admin-delivery-coverage.controller';
import { MerchantModule } from '../merchant/merchant.module';
import { LocationDirectoryModule } from '../location-directory/location-directory.module';
import { BuyerModule } from '../buyer/buyer.module';

@Module({
  imports: [MerchantModule, LocationDirectoryModule, BuyerModule],
  controllers: [MerchantDeliveryCoverageController, AdminDeliveryCoverageController],
  providers: [DeliveryCoverageService],
  exports: [DeliveryCoverageService],
})
export class DeliveryCoverageModule {}
