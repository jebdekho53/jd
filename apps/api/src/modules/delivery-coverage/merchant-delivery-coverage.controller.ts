import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import {
  AddDeliveryAreaDto,
  BulkAddDeliveryAreasDto,
  ListDeliveryAreasDto,
  UpdateDeliveryAreaDto,
} from './dto/delivery-coverage.dto';

@ApiTags(Tags.STORES)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/stores/:storeId/delivery-coverage')
export class MerchantDeliveryCoverageController {
  constructor(private readonly coverage: DeliveryCoverageService) {}

  @Get()
  @Permissions('stores:read')
  @ApiOperation({ summary: 'List delivery coverage pincodes for a store' })
  async list(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Query() query: ListDeliveryAreasDto,
  ) {
    const data = await this.coverage.listForStore(user.id, storeId, query);
    return { success: true, data };
  }

  @Get('analytics')
  @Permissions('stores:read')
  @ApiOperation({ summary: 'Coverage analytics for merchant' })
  async analytics(@CurrentUser() user: RequestUser, @Param('storeId') storeId: string) {
    const data = await this.coverage.getMerchantAnalytics(user.id, storeId);
    return { success: true, data };
  }

  @Get('export')
  @Permissions('stores:read')
  @ApiOperation({ summary: 'Export delivery coverage CSV' })
  async export(@CurrentUser() user: RequestUser, @Param('storeId') storeId: string) {
    const csv = await this.coverage.exportCsv(user.id, storeId);
    return { success: true, data: { csv } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('stores:write')
  @ApiOperation({ summary: 'Add a pincode to delivery coverage' })
  async add(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: AddDeliveryAreaDto,
  ) {
    const data = await this.coverage.addArea(user.id, storeId, dto);
    return { success: true, data };
  }

  @Post('bulk')
  @Permissions('stores:write')
  @ApiOperation({ summary: 'Bulk add pincodes to delivery coverage' })
  async bulkAdd(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: BulkAddDeliveryAreasDto,
  ) {
    const data = await this.coverage.bulkAdd(user.id, storeId, dto);
    return { success: true, data };
  }

  @Post('import')
  @Permissions('stores:write')
  @ApiOperation({ summary: 'Import delivery coverage from CSV' })
  async importCsv(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() body: { csv: string },
  ) {
    const data = await this.coverage.importCsv(user.id, storeId, body.csv ?? '');
    return { success: true, data };
  }

  @Patch(':areaId')
  @Permissions('stores:write')
  @ApiOperation({ summary: 'Update delivery area settings' })
  async update(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('areaId') areaId: string,
    @Body() dto: UpdateDeliveryAreaDto,
  ) {
    const data = await this.coverage.updateArea(user.id, storeId, areaId, dto);
    return { success: true, data };
  }

  @Delete(':areaId')
  @Permissions('stores:write')
  @ApiOperation({ summary: 'Remove pincode from delivery coverage' })
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('areaId') areaId: string,
  ) {
    const data = await this.coverage.removeArea(user.id, storeId, areaId);
    return { success: true, data };
  }
}
