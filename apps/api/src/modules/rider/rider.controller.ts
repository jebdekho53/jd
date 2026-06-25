import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
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
import { DeliveryService } from './delivery.service';
import { RiderLocationService } from './rider-location.service';
import { RiderAssignmentService } from '../rider-assignment/rider-assignment.service';
import { PrismaService } from '../../database/prisma.service';
import { UpdateRiderLocationDto } from './dto/update-rider-location.dto';
import { UpdateRiderStatusDto } from './dto/update-rider-status.dto';
import { FailDeliveryDto } from './dto/fail-delivery.dto';

@ApiTags('rider')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('RIDER')
@Controller('rider')
export class RiderController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly locationService: RiderLocationService,
    private readonly assignmentService: RiderAssignmentService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Availability ──────────────────────────────────────────────────────────

  @Patch('status')
  @Permissions('rider:status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle rider availability (ONLINE / OFFLINE)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateRiderStatusDto,
  ) {
    const riderProfile = await this.deliveryService.requireRiderProfile(user.id);
    await this.prisma.riderProfile.update({
      where: { id: riderProfile.id },
      data: { status: dto.status },
    });
    return { success: true, data: { status: dto.status } };
  }

  // ── Location ──────────────────────────────────────────────────────────────

  @Patch('location')
  @Permissions('rider:location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update rider GPS location — cached 60s in Redis, history in Postgres' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  async updateLocation(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateRiderLocationDto,
  ) {
    const riderProfile = await this.deliveryService.requireRiderProfile(user.id);
    await this.locationService.updateLocation(riderProfile.id, dto);
    return { success: true, data: { latitude: dto.latitude, longitude: dto.longitude } };
  }

  // ── Order queue ───────────────────────────────────────────────────────────

  @Get('orders')
  @Permissions('deliveries:read')
  @ApiOperation({ summary: 'Rider delivery queue — all deliveries assigned to this rider' })
  @ApiResponse({ status: 200, description: 'List of deliveries' })
  async listOrders(@CurrentUser() user: RequestUser) {
    const data = await this.deliveryService.getRiderDeliveries(user.id);
    return { success: true, data };
  }

  @Get('orders/:orderId')
  @Permissions('deliveries:read')
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Get delivery detail for a specific order' })
  @ApiResponse({ status: 200, description: 'Delivery detail' })
  async getOrder(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
  ) {
    const data = await this.deliveryService.getRiderDeliveryByOrderId(user.id, orderId);
    return { success: true, data };
  }

  // ── Delivery state transitions ────────────────────────────────────────────

  @Patch('orders/:orderId/accept')
  @Permissions('deliveries:update')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Accept delivery (ASSIGNED → ACCEPTED)' })
  @ApiResponse({ status: 200, description: 'Delivery accepted' })
  @ApiResponse({ status: 400, description: 'Delivery not in ASSIGNED status' })
  @ApiResponse({ status: 403, description: 'Delivery not assigned to this rider' })
  async acceptDelivery(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Ip() ip: string,
  ) {
    const data = await this.deliveryService.acceptDelivery(user.id, orderId, ip);
    return { success: true, data };
  }

  @Patch('orders/:orderId/reject')
  @Permissions('deliveries:update')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Reject delivery offer (within offer window)' })
  async rejectDelivery(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
  ) {
    await this.assignmentService.rejectOffer(user.id, orderId);
    return { success: true };
  }

  @Patch('orders/:orderId/arrived-store')
  @Permissions('deliveries:update')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Mark arrived at store (ACCEPTED → ARRIVED_AT_STORE)' })
  async arrivedAtStore(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Ip() ip: string,
  ) {
    const data = await this.deliveryService.arrivedAtStore(user.id, orderId, ip);
    return { success: true, data };
  }

  @Patch('orders/:orderId/picked-up')
  @Permissions('deliveries:update')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Mark order picked up from store (ARRIVED_AT_STORE → PICKED_UP)' })
  async pickedUp(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Ip() ip: string,
  ) {
    const data = await this.deliveryService.pickedUp(user.id, orderId, ip);
    return { success: true, data };
  }

  @Patch('orders/:orderId/arrived-customer')
  @Permissions('deliveries:update')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Mark arrived at customer (PICKED_UP → ARRIVED_AT_CUSTOMER)' })
  async arrivedAtCustomer(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Ip() ip: string,
  ) {
    const data = await this.deliveryService.arrivedAtCustomer(user.id, orderId, ip);
    return { success: true, data };
  }

  @Patch('orders/:orderId/delivered')
  @Permissions('deliveries:update')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Confirm delivery (ARRIVED_AT_CUSTOMER → DELIVERED)' })
  async markDelivered(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Ip() ip: string,
  ) {
    const data = await this.deliveryService.markDelivered(user.id, orderId, ip);
    return { success: true, data };
  }

  @Patch('orders/:orderId/failed')
  @Permissions('deliveries:update')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({
    summary: 'Mark delivery as failed — any non-terminal status → FAILED',
    description: 'Releases rider back to ONLINE and marks order as DELIVERY_FAILED.',
  })
  async markFailed(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: FailDeliveryDto,
    @Ip() ip: string,
  ) {
    const data = await this.deliveryService.markFailed(user.id, orderId, dto.reason, ip);
    return { success: true, data };
  }
}
