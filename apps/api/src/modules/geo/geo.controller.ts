import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { GeoService } from './geo.service';

@ApiTags(Tags.HEALTH)
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Public()
  @Get('cities')
  @ApiOperation({ summary: 'List active cities for store onboarding' })
  async listCities() {
    const data = await this.geoService.listCities();
    return { success: true, data };
  }

  @Public()
  @Get('cities/:cityId/zones')
  @ApiOperation({ summary: 'List delivery zones for a city' })
  async listZones(@Param('cityId') cityId: string) {
    const data = await this.geoService.listZonesByCity(cityId);
    return { success: true, data };
  }
}
