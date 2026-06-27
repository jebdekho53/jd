import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { PrismaService } from '../../database/prisma.service';
import { DeliveryOrchestratorService } from './delivery-orchestrator.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

@ApiTags('merchant-logistics')
@Controller('merchant/orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
export class MerchantLogisticsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: DeliveryOrchestratorService,
  ) {}

  @Get(':orderId/shipment')
  @ApiOperation({ summary: 'Get provider shipment details for an order' })
  async getShipment(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    await this.assertMerchantOrder(user.id, orderId);
    const shipment = await this.prisma.providerShipment.findUnique({
      where: { orderId },
      include: {
        events: { orderBy: { occurredAt: 'desc' }, take: 20 },
        provider: { select: { name: true, type: true } },
      },
    });
    if (!shipment) throw new NotFoundException('No shipment for this order');
    return { success: true, data: shipment };
  }

  @Post(':orderId/shipment/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel provider shipment' })
  async cancelShipment(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string },
  ) {
    await this.assertMerchantOrder(user.id, orderId);
    await this.orchestrator.cancelShipment(orderId, body.reason);
    return { success: true };
  }

  @Post(':orderId/shipment/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry failed shipment creation' })
  async retryShipment(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    await this.assertMerchantOrder(user.id, orderId);
    const data = await this.orchestrator.retryShipment(orderId);
    return { success: true, data };
  }

  private async assertMerchantOrder(userId: string, orderId: string) {
    const stores = await this.prisma.store.findMany({
      where: { merchantProfile: { userId } },
      select: { id: true },
    });
    const storeIds = stores.map((s) => s.id);
    if (storeIds.length === 0) throw new ForbiddenException('No stores');

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId: { in: storeIds } },
      select: { id: true },
    });
    if (!order) throw new NotFoundException('Order not found');
  }
}
