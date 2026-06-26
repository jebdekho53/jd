import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { LocationDirectoryService } from './location-directory.service';
import {
  ImportLocationsDto,
  ListAdminLocationsDto,
  SetLocationActiveDto,
} from './dto/location-directory.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/locations')
export class AdminLocationDirectoryController {
  constructor(private readonly locations: LocationDirectoryService) {}

  @Get()
  @Permissions('locations:read')
  @ApiOperation({ summary: 'List master location pincodes with filters' })
  async list(@Query() query: ListAdminLocationsDto) {
    const data = await this.locations.adminList(query);
    return { success: true, data };
  }

  @Get('stats')
  @Permissions('locations:read')
  @ApiOperation({ summary: 'Coverage statistics' })
  async stats() {
    const data = await this.locations.adminStats();
    return { success: true, data };
  }

  @Get('export')
  @Permissions('locations:manage')
  @ApiOperation({ summary: 'Export master locations CSV' })
  async export(@Res() res: Response) {
    const csv = await this.locations.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="master-locations.csv"');
    res.send(csv);
  }

  @Post('import')
  @Permissions('locations:manage')
  @ApiOperation({ summary: 'Import master locations CSV' })
  async import(@Body() body: ImportLocationsDto) {
    const data = await this.locations.importCsv(body.csv);
    return { success: true, data };
  }

  @Patch('pincodes/:id/active')
  @Permissions('locations:manage')
  @ApiOperation({ summary: 'Enable or disable a pincode' })
  async setActive(@Param('id') id: string, @Body() body: SetLocationActiveDto) {
    const data = await this.locations.setPincodeActive(id, body.isActive);
    return { success: true, data };
  }
}
