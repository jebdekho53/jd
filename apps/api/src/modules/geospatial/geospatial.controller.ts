import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequestUser } from '../../common/types/index';
import { ALLOWED_DELIVERY_RADII_KM } from '../../common/utils/geospatial.util';
import { GeospatialService } from './geospatial.service';
import {
  CheckDeliverabilityDto,
  CreateAddressDto,
  MapStoresQueryDto,
  UpdateAddressDto,
} from './dto/geospatial.dto';

@ApiTags('buyer / geo')
@Controller('buyer')
export class BuyerGeospatialController {
  constructor(private readonly geo: GeospatialService) {}

  @Public()
  @Get('map/stores')
  @ApiOperation({ summary: 'Map pins for nearby deliverable stores' })
  async mapStores(@Query() dto: MapStoresQueryDto) {
    const data = await this.geo.getMapStores(dto.lat, dto.lng, dto.radiusKm ?? 10);
    return { success: true, data };
  }

  @Public()
  @Get('geo/deliverability')
  @ApiOperation({ summary: 'Check if a store delivers to coordinates' })
  async deliverability(@Query() dto: CheckDeliverabilityDto) {
    const data = await this.geo.checkDeliverability(dto);
    return { success: true, data };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  @Get('addresses')
  @ApiOperation({ summary: 'List saved buyer addresses' })
  async listAddresses(@CurrentUser() user: RequestUser) {
    const data = await this.geo.listAddresses(user.id);
    return { success: true, data };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  @Post('addresses')
  @ApiOperation({ summary: 'Create saved address' })
  async createAddress(@CurrentUser() user: RequestUser, @Body() dto: CreateAddressDto) {
    const data = await this.geo.createAddress(user.id, dto);
    return { success: true, data };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Update saved address' })
  async updateAddress(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const data = await this.geo.updateAddress(user.id, id, dto);
    return { success: true, data };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete saved address' })
  async deleteAddress(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.geo.deleteAddress(user.id, id);
    return { success: true, data };
  }
}

@ApiTags('admin / geo')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/geo')
export class AdminGeospatialController {
  constructor(private readonly geo: GeospatialService) {}

  @Get('delivery-radii')
  @ApiOperation({ summary: 'Allowed store delivery radii (km)' })
  allowedRadii() {
    return { success: true, data: ALLOWED_DELIVERY_RADII_KM };
  }

  @Get('operations-map')
  @ApiOperation({ summary: 'Operations control map data' })
  async operationsMap() {
    const data = await this.geo.getOperationsMap();
    return { success: true, data };
  }

  @Get('hotspots')
  @ApiOperation({ summary: 'Delivery hotspot analytics' })
  async hotspots() {
    const data = await this.geo.getHotspotAnalytics();
    return { success: true, data };
  }
}

@ApiTags('merchant / geo')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
@Controller('merchant/stores')
export class MerchantGeospatialController {
  constructor(private readonly geo: GeospatialService) {}

  @Get(':storeId/area-analytics')
  @ApiOperation({ summary: 'Top delivery areas for merchant store' })
  async areaAnalytics(@CurrentUser() user: RequestUser, @Param('storeId') storeId: string) {
    const data = await this.geo.getMerchantAreaAnalytics(user.id, storeId);
    return { success: true, data };
  }
}
