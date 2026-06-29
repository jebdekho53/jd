import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { GeocodingCacheService } from './geocoding-cache.service';

@ApiTags('geocoding')
@Controller('geo/geocode')
export class GeocodingController {
  constructor(private readonly geocoding: GeocodingCacheService) {}

  @Get('reverse')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({
    summary: 'Reverse geocode lat/lng with Redis cache',
    description: 'Returns null when Google is unavailable — clients should fall back to pincode/master directory.',
  })
  async reverse(@Query('lat') latRaw: string, @Query('lng') lngRaw: string) {
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { success: true, data: null };
    }
    const data = await this.geocoding.reverseGeocode(lat, lng);
    return { success: true, data };
  }

  @Get('pincode')
  @Public()
  @ApiOperation({ summary: 'Lookup cached geocode by pincode' })
  async byPincode(@Query('pincode') pincode: string) {
    const data = await this.geocoding.getByPincode(pincode ?? '');
    return { success: true, data };
  }
}
