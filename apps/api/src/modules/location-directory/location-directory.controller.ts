import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { LocationDirectoryService } from './location-directory.service';
import { SearchLocationsDto } from './dto/location-directory.dto';

@ApiTags(Tags.HEALTH)
@Controller('locations')
export class LocationDirectoryController {
  constructor(private readonly locations: LocationDirectoryService) {}

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search master location directory (aliases, pincodes, areas)' })
  async search(@Query() query: SearchLocationsDto) {
    const data = await this.locations.search(query);
    return { success: true, data };
  }

  @Public()
  @Get('filters')
  @ApiOperation({ summary: 'List states, districts, cities for filters' })
  async filters() {
    const data = await this.locations.listFilters();
    return { success: true, data };
  }

  @Public()
  @Get('pincodes/:pincode')
  @ApiOperation({ summary: 'Lookup all post offices for a pincode' })
  async byPincode(@Param('pincode') pincode: string) {
    const data = await this.locations.getByPincode(pincode);
    return { success: true, data };
  }

  @Public()
  @Get('slugs/:slug')
  @ApiOperation({ summary: 'Resolve SEO slug to location' })
  async bySlug(@Param('slug') slug: string) {
    const data = await this.locations.getBySlug(slug);
    return { success: true, data };
  }
}
