import { Module } from '@nestjs/common';
import { BuyerModule } from '../buyer/buyer.module';
import { DeliveryTrackingModule } from '../delivery-tracking/delivery-tracking.module';
import { FleetOsModule } from '../fleet-os/fleet-os.module';
import { AICommerceModule } from '../ai-commerce/ai-commerce.module';
import { GeospatialService } from './geospatial.service';
import {
  AdminGeospatialController,
  BuyerGeospatialController,
  MerchantGeospatialController,
} from './geospatial.controller';
import { AdminStoreGeoController } from './admin-store-geo.controller';

@Module({
  imports: [BuyerModule, DeliveryTrackingModule, FleetOsModule, AICommerceModule],
  controllers: [
    BuyerGeospatialController,
    AdminGeospatialController,
    AdminStoreGeoController,
    MerchantGeospatialController,
  ],
  providers: [GeospatialService],
  exports: [GeospatialService],
})
export class GeospatialModule {}
