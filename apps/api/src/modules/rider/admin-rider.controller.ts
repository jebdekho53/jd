import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types/index';
import { RiderAssignmentService } from './rider-assignment.service';
import { PrismaService } from '../../database/prisma.service';
import { AssignRiderDto } from './dto/assign-rider.dto';

@ApiTags('admin / riders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminRiderController {
  constructor(
    private readonly assignmentService: RiderAssignmentService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Rider queue — orders ready for pickup with no assigned rider ──────────

  @Get('rider-queue')
  @Permissions('orders:manage')
  @ApiOperation({
    summary: 'Get orders ready for rider assignment',
    description: 'Returns READY_FOR_PICKUP orders without an active rider assignment.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Order queue for rider assignment' })
  async getRiderQueue(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          status: OrderStatus.READY_FOR_PICKUP,
          delivery: { is: null },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'asc' }, // oldest first — fairness
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentMethod: true,
          totalAmount: true,
          createdAt: true,
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              latitude: true,
              longitude: true,
              storeZones: { select: { zone: { select: { id: true, name: true } } } },
            },
          },
          buyerProfile: { select: { name: true } },
          items: { select: { productName: true, quantity: true }, take: 3 },
        },
      }),
      this.prisma.order.count({
        where: { status: OrderStatus.READY_FOR_PICKUP, delivery: { is: null } },
      }),
    ]);

    return {
      success: true,
      data: orders,
      meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    };
  }

  // ── Manual assign ─────────────────────────────────────────────────────────

  @Post('orders/:orderId/assign-rider')
  @Permissions('orders:manage')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({
    summary: 'Manually assign a rider to a READY_FOR_PICKUP order',
  })
  @ApiResponse({ status: 200, description: 'Rider assigned' })
  @ApiResponse({ status: 400, description: 'Order not ready or rider unavailable' })
  @ApiResponse({ status: 404, description: 'Order or rider not found' })
  async assignRider(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: AssignRiderDto,
    @Ip() ip: string,
  ) {
    const data = await this.assignmentService.assignRider(
      orderId, dto.riderProfileId, user.id, ip,
    );
    return { success: true, data };
  }

  // ── Reassign ──────────────────────────────────────────────────────────────

  @Post('orders/:orderId/reassign-rider')
  @Permissions('orders:manage')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({
    summary: 'Reassign a delivery to a different rider',
    description:
      'Cancels the current assignment (if ASSIGNED/ACCEPTED/ARRIVED_AT_STORE) and ' +
      'creates a new one for the specified rider.',
  })
  @ApiResponse({ status: 200, description: 'Rider reassigned' })
  async reassignRider(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: AssignRiderDto,
    @Ip() ip: string,
  ) {
    const data = await this.assignmentService.reassignRider(
      orderId, dto.riderProfileId, user.id, ip,
    );
    return { success: true, data };
  }

  // ── Auto-assign trigger ───────────────────────────────────────────────────

  @Post('orders/:orderId/auto-assign')
  @Permissions('orders:manage')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({
    summary: 'Trigger auto-assignment for an order',
    description:
      'Runs the scoring algorithm (same zone → online → fewest deliveries → nearest) ' +
      'and assigns the best available rider.',
  })
  @ApiResponse({ status: 200, description: 'Auto-assignment result' })
  async autoAssign(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
  ) {
    const data = await this.assignmentService.autoAssign(orderId);
    if (!data) {
      return { success: false, data: null, message: 'No eligible riders found for auto-assignment' };
    }
    return { success: true, data };
  }
}
