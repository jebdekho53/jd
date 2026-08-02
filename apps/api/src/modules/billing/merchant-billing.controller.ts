import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { OfflineBillingService } from './offline-billing.service';
import { CreateOfflineBillDto, ListOfflineBillsDto } from './dto/offline-bill.dto';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/stores/:storeId/offline-bills')
export class MerchantBillingController {
  constructor(private readonly billing: OfflineBillingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Create an in-store bill across one or more existing products, decrementing stock' })
  async create(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: CreateOfflineBillDto,
    @Ip() ip: string,
  ) {
    const data = await this.billing.createBill(user.id, storeId, dto, ip);
    return { success: true, data };
  }

  @Get()
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'List in-store bills for this store' })
  async list(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Query() dto: ListOfflineBillsDto,
  ) {
    const data = await this.billing.listBills(user.id, storeId, dto);
    return { success: true, data };
  }

  @Get('customers')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'List distinct walk-in customers captured via in-store bills' })
  async customers(@CurrentUser() user: RequestUser, @Param('storeId') storeId: string) {
    const data = await this.billing.listCustomers(user.id, storeId);
    return { success: true, data };
  }

  @Get(':billId')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Get a single in-store bill with its line items' })
  async get(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('billId') billId: string,
  ) {
    const data = await this.billing.getBill(user.id, storeId, billId);
    return { success: true, data };
  }
}
