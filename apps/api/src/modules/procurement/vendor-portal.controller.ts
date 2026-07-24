import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { VendorPortalService } from './vendor-portal.service';
import {
  CreateVendorProductDto,
  ResolveDisputeDto,
  ResolveReturnDto,
  ShipVendorOrderDto,
} from './dto/procurement.dto';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR')
@Controller('vendor')
export class VendorPortalController {
  constructor(private readonly vendor: VendorPortalService) {}

  @Get('orders')
  async orders(@CurrentUser() user: RequestUser) {
    return { success: true, data: await this.vendor.listOrders(user.id) };
  }

  @Patch('orders/:id/ship')
  async ship(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ShipVendorOrderDto,
  ) {
    return { success: true, data: await this.vendor.shipOrder(user.id, id, dto) };
  }

  @Patch('orders/:id/deliver')
  async deliver(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return { success: true, data: await this.vendor.deliverOrder(user.id, id) };
  }

  @Get('returns')
  async returns(@CurrentUser() user: RequestUser) {
    return { success: true, data: await this.vendor.listReturns(user.id) };
  }

  @Patch('returns/:id/resolve')
  async resolveReturn(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ResolveReturnDto,
  ) {
    return { success: true, data: await this.vendor.resolveReturn(user.id, id, dto) };
  }

  @Get('disputes')
  async disputes(@CurrentUser() user: RequestUser) {
    return { success: true, data: await this.vendor.listDisputes(user.id) };
  }

  @Patch('disputes/:id/resolve')
  async resolveDispute(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return { success: true, data: await this.vendor.resolveDispute(user.id, id, dto) };
  }

  @Get('catalog')
  async catalog(@CurrentUser() user: RequestUser) {
    return { success: true, data: await this.vendor.getCatalog(user.id) };
  }

  @Post('catalog/products')
  async createProduct(@CurrentUser() user: RequestUser, @Body() dto: CreateVendorProductDto) {
    return { success: true, data: await this.vendor.createProduct(user.id, dto) };
  }
}
