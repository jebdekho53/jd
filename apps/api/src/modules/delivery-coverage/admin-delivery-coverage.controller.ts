import {
  Body,
  Controller,
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
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { DeliveryCoverageService } from './delivery-coverage.service';
import { AdminCoverageSearchDto } from './dto/delivery-coverage.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/delivery-coverage')
export class AdminDeliveryCoverageController {
  constructor(private readonly coverage: DeliveryCoverageService) {}

  @Get('overview')
  @Permissions('locations:read')
  @ApiOperation({ summary: 'Platform-wide delivery coverage overview' })
  async overview() {
    const data = await this.coverage.getAdminOverview();
    return { success: true, data };
  }

  @Get('search')
  @Permissions('locations:read')
  @ApiOperation({ summary: 'Search store delivery coverage rows' })
  async search(@Query() query: AdminCoverageSearchDto) {
    const data = await this.coverage.adminSearchCoverage(query);
    return { success: true, data };
  }

  @Patch('pincodes/:pincode/active')
  @Permissions('locations:write')
  @ApiOperation({ summary: 'Enable or disable a master pincode platform-wide' })
  async setPincodeActive(
    @CurrentUser() user: RequestUser,
    @Param('pincode') pincode: string,
    @Body() body: { isActive: boolean },
  ) {
    const data = await this.coverage.adminSetPincodeActive(
      pincode,
      body.isActive,
      user.id,
    );
    return { success: true, data };
  }

  @Post('import')
  @Permissions('locations:write')
  @ApiOperation({ summary: 'Admin bulk import coverage for a store' })
  async adminImport(@Body() body: { storeId: string; csv: string }) {
    const data = await this.coverage.adminImportCsv(body.storeId, body.csv ?? '');
    return { success: true, data };
  }
}
