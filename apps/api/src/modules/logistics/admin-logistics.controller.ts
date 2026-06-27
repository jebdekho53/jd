import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DeliveryOrchestratorService } from './delivery-orchestrator.service';
import { LogisticsProviderRegistry } from './logistics-provider.registry';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

@ApiTags('admin-logistics')
@Controller('admin/logistics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminLogisticsController {
  constructor(
    private readonly orchestrator: DeliveryOrchestratorService,
    private readonly registry: LogisticsProviderRegistry,
    private readonly prisma: PrismaService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Logistics operations dashboard' })
  async dashboard() {
    const stats = await this.orchestrator.getDashboardStats();
    return {
      success: true,
      data: {
        ...stats,
        registeredProviders: this.registry.listRegistered(),
      },
    };
  }

  @Post('health-check')
  @ApiOperation({ summary: 'Run health check on active provider' })
  async healthCheck() {
    const provider = this.registry.getPrimary();
    const result = await provider.healthCheck();
    return { success: true, data: { provider: provider.type, ...result } };
  }

  @Get('webhooks/recent')
  @ApiOperation({ summary: 'Recent provider webhook events' })
  async recentWebhooks() {
    const events = await this.prisma.providerWebhook.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        providerType: true,
        eventId: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        processedAt: true,
      },
    });
    return { success: true, data: events };
  }

  @Post('shipments/:shipmentId/retry')
  @ApiOperation({ summary: 'Retry failed shipment creation by provider shipment id' })
  async retryShipment(@Param('shipmentId') shipmentId: string) {
    const shipment = await this.prisma.providerShipment.findUnique({
      where: { id: shipmentId },
      select: { orderId: true, externalShipmentId: true },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (shipment.externalShipmentId) {
      return { success: false, message: 'Shipment already created with provider' };
    }
    const data = await this.orchestrator.retryShipment(shipment.orderId);
    return { success: true, data };
  }
}
