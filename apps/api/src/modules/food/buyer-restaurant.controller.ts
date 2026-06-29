import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { RestaurantDiscoveryService } from './restaurant-discovery.service';
import { MenuService } from './menu.service';
import { VerticalBusinessType } from '@prisma/client';

@ApiTags('food / discovery')
@Controller('buyer')
export class BuyerRestaurantController {
  constructor(
    private readonly discovery: RestaurantDiscoveryService,
    private readonly menu: MenuService,
  ) {}

  @Public()
  @Get('verticals')
  @ApiOperation({ summary: 'Homepage vertical navigation tabs' })
  getVerticals() {
    return { success: true, data: this.discovery.getHomeVerticals() };
  }

  @Public()
  @Get('restaurants')
  @ApiOperation({ summary: 'List nearby restaurants' })
  async listRestaurants(
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
    @Query('pincode') pincode?: string,
    @Query('cuisine') cuisineSlug?: string,
    @Query('vertical') vertical?: VerticalBusinessType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.discovery.listRestaurants({
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      pincode: pincode?.trim() || undefined,
      cuisineSlug,
      vertical,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return { success: true, data };
  }

  @Public()
  @Get('restaurants/:slug')
  @ApiOperation({ summary: 'Restaurant detail page' })
  async getRestaurant(@Param('slug') slug: string) {
    const data = await this.discovery.getRestaurantDetail(slug);
    return { success: true, data };
  }

  @Public()
  @Get('restaurants/:slug/menu')
  @ApiOperation({ summary: 'Full restaurant menu with addons and combos' })
  async getMenu(@Param('slug') slug: string) {
    const data = await this.menu.getBuyerMenu(slug);
    return { success: true, data };
  }

  @Public()
  @Get('cuisines')
  async listCuisines() {
    const data = await this.discovery.listCuisines();
    return { success: true, data };
  }
}
