import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
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
import { RiderCaptainService } from './rider-captain.service';
import {
  ListRiderDocumentsQueryDto,
  ListRiderIncentivesQueryDto,
  RejectRiderDocumentDto,
  UpdateRiderIncentiveDto,
  UpsertRiderIncentiveDto,
} from './dto/rider-captain.dto';

@ApiTags('admin / riders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminRiderController {
  constructor(
    private readonly assignmentService: RiderAssignmentService,
    private readonly captain: RiderCaptainService,
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

  @Get('riders/kyc/documents')
  @Permissions('orders:manage')
  @ApiOperation({ summary: 'List rider KYC documents for admin review' })
  async listRiderKycDocuments(@Query() query: ListRiderDocumentsQueryDto) {
    return { success: true, data: await this.captain.adminListDocuments(query.status) };
  }

  @Post('riders/kyc/documents/:documentId/approve')
  @Permissions('orders:manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a rider KYC document' })
  async approveRiderKycDocument(
    @CurrentUser() user: RequestUser,
    @Param('documentId') documentId: string,
  ) {
    return { success: true, data: await this.captain.adminApproveDocument(documentId, user.id) };
  }

  @Post('riders/kyc/documents/:documentId/reject')
  @Permissions('orders:manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a rider KYC document with a reason' })
  async rejectRiderKycDocument(
    @CurrentUser() user: RequestUser,
    @Param('documentId') documentId: string,
    @Body() dto: RejectRiderDocumentDto,
  ) {
    return { success: true, data: await this.captain.adminRejectDocument(documentId, user.id, dto.reason) };
  }

  @Get('riders/incentives')
  @Permissions('orders:manage')
  @ApiOperation({ summary: 'List rider incentive campaigns' })
  async listRiderIncentives(@Query() query: ListRiderIncentivesQueryDto) {
    return { success: true, data: await this.captain.adminListIncentives(query.status) };
  }

  @Post('riders/incentives')
  @Permissions('orders:manage')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a rider incentive campaign' })
  async createRiderIncentive(@Body() dto: UpsertRiderIncentiveDto) {
    return { success: true, data: await this.captain.adminCreateIncentive(dto) };
  }

  @Patch('riders/incentives/:incentiveId')
  @Permissions('orders:manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update or deactivate a rider incentive campaign' })
  async updateRiderIncentive(
    @Param('incentiveId') incentiveId: string,
    @Body() dto: UpdateRiderIncentiveDto,
  ) {
    return { success: true, data: await this.captain.adminUpdateIncentive(incentiveId, dto) };
  }
}
