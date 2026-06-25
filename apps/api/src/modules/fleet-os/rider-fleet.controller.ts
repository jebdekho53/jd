import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { PrismaService } from '../../database/prisma.service';
import { BatchingService } from './batching.service';
import { RouteOptimizationService } from './route-optimization.service';

@ApiTags(Tags.RIDERS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RIDER')
@Controller('rider/fleet')
export class RiderFleetController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batching: BatchingService,
    private readonly routes: RouteOptimizationService,
  ) {}

  private async riderId(userId: string) {
    const profile = await this.prisma.riderProfile.findUnique({ where: { userId } });
    return profile?.id;
  }

  @Get('queue')
  async queue(@CurrentUser() user: RequestUser) {
    const riderId = await this.riderId(user.id);
    if (!riderId) return { success: true, data: null };
    const batch = await this.batching.getRiderBatch(riderId);
    return {
      success: true,
      data: {
        currentBatch: batch,
        upcomingOrders: batch?.items.filter((i) => i.sequence > 1) ?? [],
      },
    };
  }

  @Get('route')
  async route(@CurrentUser() user: RequestUser) {
    const riderId = await this.riderId(user.id);
    if (!riderId) return { success: true, data: null };
    const route = await this.routes.getLatestForRider(riderId);
    return { success: true, data: route };
  }
}
