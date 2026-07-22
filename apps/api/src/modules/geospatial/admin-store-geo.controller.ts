import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/index';
import { GeospatialService } from './geospatial.service';
import { UpdateStoreRadiusDto } from './dto/geospatial.dto';

@ApiTags('admin / stores / geo')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/stores')
export class AdminStoreGeoController {
  constructor(private readonly geo: GeospatialService) {}

  @Patch(':id/delivery-radius')
  @ApiOperation({ summary: 'Set store delivery radius and locality' })
  async updateRadius(
    @CurrentUser() user: RequestUser,
    @Param('id') storeId: string,
    @Body() dto: UpdateStoreRadiusDto,
  ) {
    const data = await this.geo.updateStoreRadius(user.id, storeId, dto);
    return { success: true, data };
  }
}
