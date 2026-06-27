import { Module } from '@nestjs/common';
import { GeocodingCacheService } from './geocoding-cache.service';
import { GeocodingController } from './geocoding.controller';

@Module({
  controllers: [GeocodingController],
  providers: [GeocodingCacheService],
  exports: [GeocodingCacheService],
})
export class GeocodingModule {}
