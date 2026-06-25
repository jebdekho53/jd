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
import { RiderAssignmentService } from './rider-assignment.service';
import { AssignRiderDto } from './dto/assign-rider.dto';

@ApiTags('admin / rider-assignments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/rider-assignments')
export class RiderAssignmentController {
  constructor(private readonly assignment: RiderAssignmentService) {}

  @Get('unassigned')
  @Permissions('orders:manage')
  @ApiOperation({ summary: 'Orders needing rider assignment' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listUnassigned(@Query('page') page = 1, @Query('limit') limit = 20) {
    const data = await this.assignment.listUnassignedOrders(Number(page), Number(limit));
    return { success: true, ...data };
  }

  @Get('riders')
  @Permissions('orders:manage')
  @ApiOperation({ summary: 'Live rider operations board' })
  @ApiQuery({ name: 'status', required: false, enum: ['ONLINE', 'OFFLINE', 'BUSY', 'SUSPENDED'] })
  async listRiders(@Query('status') status?: string) {
    const data = await this.assignment.listLiveRiders({ status });
    return { success: true, data };
  }

  @Get('metrics')
  @Permissions('orders:manage')
  @ApiOperation({ summary: 'Rider assignment metrics' })
  async metrics() {
    const data = await this.assignment.getMetrics();
    return { success: true, data };
  }

  @Get('available')
  @Permissions('orders:manage')
  @ApiQuery({ name: 'storeId', required: true })
  async availableRiders(@Query('storeId') storeId: string) {
    const data = await this.assignment.getAvailableRiders(storeId);
    return { success: true, data };
  }

  @Post('orders/:orderId/assign-rider')
  @Permissions('orders:manage')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  async assign(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: AssignRiderDto,
    @Ip() ip: string,
  ) {
    const data = await this.assignment.assign(orderId, dto.riderProfileId, user.id, ip);
    return { success: true, data };
  }

  @Post('orders/:orderId/reassign-rider')
  @Permissions('orders:manage')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  async reassign(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: AssignRiderDto,
    @Ip() ip: string,
  ) {
    const data = await this.assignment.reassign(orderId, dto.riderProfileId, user.id, ip);
    return { success: true, data };
  }

  @Post('orders/:orderId/auto-assign')
  @Permissions('orders:manage')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  async autoAssign(@Param('orderId') orderId: string) {
    const data = await this.assignment.autoAssign(orderId);
    if (!data) {
      return { success: false, data: null, message: 'No eligible riders found' };
    }
    return { success: true, data };
  }

  @Post('orders/:orderId/unassign')
  @Permissions('orders:manage')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  async unassign(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Ip() ip: string,
  ) {
    await this.assignment.unassign(orderId, user.id, ip);
    return { success: true };
  }
}
