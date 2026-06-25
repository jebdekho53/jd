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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types/index';
import { RiderAssignmentService } from '../rider-assignment/rider-assignment.service';
import { AssignRiderDto } from './dto/assign-rider.dto';

@ApiTags('admin / riders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminRiderController {
  constructor(private readonly assignmentService: RiderAssignmentService) {}

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
    const result = await this.assignmentService.listUnassignedOrders(Number(page), Number(limit));
    return {
      success: true,
      data: result.orders,
      meta: result.meta,
    };
  }

  @Get('riders/available')
  @Permissions('orders:manage')
  @ApiOperation({ summary: 'List riders available for assignment to a store' })
  @ApiQuery({ name: 'storeId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Available riders ranked by zone match and distance' })
  async listAvailableRiders(@Query('storeId') storeId: string) {
    const data = await this.assignmentService.listAvailableRidersForStore(storeId);
    return { success: true, data };
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
    const data = await this.assignmentService.assign(
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
    const data = await this.assignmentService.reassign(
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

  @Post('orders/:orderId/unassign')
  @Permissions('orders:manage')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Unassign rider and return order to pickup queue' })
  async unassign(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Ip() ip: string,
  ) {
    await this.assignmentService.unassign(orderId, user.id, ip);
    return { success: true };
  }
}
