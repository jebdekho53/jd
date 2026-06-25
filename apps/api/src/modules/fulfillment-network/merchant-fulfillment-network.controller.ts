import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { FulfillmentNetworkService } from './fulfillment-network.service';
import { InventoryTransferService } from './inventory-transfer.service';
import { CreateTransferDto, NetworkQueryDto } from './dto/fulfillment.dto';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
@Controller('merchant')
export class MerchantFulfillmentNetworkController {
  constructor(
    private readonly network: FulfillmentNetworkService,
    private readonly transfers: InventoryTransferService,
  ) {}

  @Get('network/overview')
  async overview(@CurrentUser() user: RequestUser, @Query() query: NetworkQueryDto) {
    return { success: true, data: await this.network.getOverview(user.id, query.storeId) };
  }

  @Get('network/capacity')
  async capacity(@CurrentUser() user: RequestUser, @Query() query: NetworkQueryDto) {
    return { success: true, data: await this.network.getCapacity(user.id, query.storeId) };
  }

  @Get('network/transfers')
  async transfersList(@CurrentUser() user: RequestUser, @Query() query: NetworkQueryDto) {
    return { success: true, data: await this.transfers.listTransfers(user.id, query.storeId) };
  }

  @Get('network/rebalancing')
  async rebalancing(@CurrentUser() user: RequestUser, @Query() query: NetworkQueryDto) {
    return { success: true, data: await this.network.getRebalancing(user.id, query.storeId) };
  }

  @Get('network/performance')
  async performance(@CurrentUser() user: RequestUser, @Query() query: NetworkQueryDto) {
    return { success: true, data: await this.network.getPerformance(user.id, query.storeId) };
  }

  @Post('inventory/transfers')
  async createTransfer(@CurrentUser() user: RequestUser, @Body() dto: CreateTransferDto) {
    return { success: true, data: await this.transfers.createTransfer(user.id, dto) };
  }

  @Get('inventory/transfers')
  async listInventoryTransfers(@CurrentUser() user: RequestUser, @Query() query: NetworkQueryDto) {
    return { success: true, data: await this.transfers.listTransfers(user.id, query.storeId) };
  }

  @Patch('inventory/transfers/:id/approve')
  async approveTransfer(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return { success: true, data: await this.transfers.approveTransfer(user.id, id) };
  }

  @Patch('inventory/transfers/:id/complete')
  async completeTransfer(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return { success: true, data: await this.transfers.completeTransfer(user.id, id) };
  }
}
