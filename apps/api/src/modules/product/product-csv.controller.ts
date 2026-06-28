import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { ProductCsvService } from './product-csv.service';
import { ProductCsvBodyDto, ProductCsvImportDto } from './dto/product-csv.dto';

const STORE_PARAM = ':storeId';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller(`merchant/stores/${STORE_PARAM}/products/csv`)
export class ProductCsvController {
  constructor(private readonly csvService: ProductCsvService) {}

  @Get('template')
  @Permissions('products:read')
  @ApiParam({ name: 'storeId' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="product-import-template.csv"')
  @ApiOperation({ summary: 'Download product CSV import template' })
  getTemplate() {
    return this.csvService.getTemplate();
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiOperation({ summary: 'Validate CSV rows before import (free)' })
  async validate(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() body: ProductCsvBodyDto,
  ) {
    const data = await this.csvService.validateCsv(user.id, storeId, body.csv);
    return { success: true, data };
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiOperation({ summary: 'Import validated CSV rows (free)' })
  async importCsv(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() body: ProductCsvImportDto,
    @Ip() ip: string,
  ) {
    const data = await this.csvService.importCsv(
      user.id,
      storeId,
      body.csv,
      body.rowNumbers,
      ip,
    );
    return { success: true, data };
  }
}
