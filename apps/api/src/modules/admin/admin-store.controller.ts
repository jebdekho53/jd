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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { StepUpGuard } from '../../common/guards/step-up.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireStepUp } from '../../common/decorators/require-step-up.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { AdminStoreService } from './admin-store.service';
import { ListStoreApprovalsDto } from './dto/list-store-approvals.dto';
import { RejectStoreDto } from './dto/reject-store.dto';
import { RequestDocumentsDto } from './dto/request-documents.dto';
import { RevokeRejectionDto } from './dto/revoke-rejection.dto';
import { SuspendStoreDto } from './dto/suspend-store.dto';
import { DeleteStoreDto } from './dto/delete-store.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/store-approvals')
export class AdminStoreController {
  constructor(private readonly adminStoreService: AdminStoreService) {}

  // --------------------------------------------------------------------------
  // GET /admin/store-approvals
  // --------------------------------------------------------------------------
  @Get()
  @Permissions('stores:approve')
  @ApiOperation({
    summary: 'List stores pending review (default) or filtered by any status',
  })
  @ApiResponse({ status: 200, description: 'Store list with merchant info' })
  async listApprovals(
    @Query() query: ListStoreApprovalsDto,
  ) {
    const { stores, total } = await this.adminStoreService.listStoreApprovals(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return {
      success: true,
      data: stores,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // --------------------------------------------------------------------------
  // GET /admin/store-approvals/:id
  // --------------------------------------------------------------------------
  @Get(':id')
  @Permissions('stores:approve')
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiOperation({ summary: 'Get full store detail for admin review' })
  @ApiResponse({ status: 200, description: 'Store detail' })
  async getStoreDetail(@Param('id') storeId: string) {
    const data = await this.adminStoreService.getStoreDetail(storeId);
    return { success: true, data };
  }

  // --------------------------------------------------------------------------
  // POST /admin/store-approvals/:id/approve
  // --------------------------------------------------------------------------
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:approve')
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiOperation({ summary: 'Approve a PENDING_REVIEW or UNDER_REVIEW store — makes it live on the platform' })
  @ApiResponse({ status: 200, description: 'Store approved and now live' })
  @ApiResponse({ status: 400, description: 'Store not in approvable status' })
  async approveStore(
    @CurrentUser() user: RequestUser,
    @Param('id') storeId: string,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const data = await this.adminStoreService.approveStore(
      user.id,
      storeId,
      ip,
      req.headers['user-agent'],
    );
    return { success: true, data };
  }

  // --------------------------------------------------------------------------
  // POST /admin/store-approvals/:id/request-documents
  // --------------------------------------------------------------------------
  @Post(':id/request-documents')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:approve')
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiOperation({ summary: 'Request additional documents from merchant' })
  @ApiResponse({ status: 200, description: 'Store moved to DOCUMENTS_REQUIRED' })
  async requestDocuments(
    @CurrentUser() user: RequestUser,
    @Param('id') storeId: string,
    @Body() dto: RequestDocumentsDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const data = await this.adminStoreService.requestDocuments(
      user.id,
      storeId,
      dto,
      ip,
      req.headers['user-agent'],
    );
    return { success: true, data };
  }

  // --------------------------------------------------------------------------
  // POST /admin/store-approvals/:id/reject
  // --------------------------------------------------------------------------
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:reject')
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiOperation({ summary: 'Reject a store with a typed rejection (revocable or permanent blacklist)' })
  @ApiResponse({ status: 200, description: 'Store rejected' })
  @ApiResponse({ status: 400, description: 'Store not in rejectable status' })
  async rejectStore(
    @CurrentUser() user: RequestUser,
    @Param('id') storeId: string,
    @Body() dto: RejectStoreDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const data = await this.adminStoreService.rejectStore(
      user.id,
      storeId,
      dto,
      ip,
      req.headers['user-agent'],
    );
    return { success: true, data };
  }

  // --------------------------------------------------------------------------
  // POST /admin/store-approvals/:id/revoke-rejection
  // --------------------------------------------------------------------------
  @Post(':id/revoke-rejection')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:approve')
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiOperation({ summary: 'Revoke a revocable rejection — REJECTED → UNDER_REVIEW' })
  @ApiResponse({ status: 200, description: 'Rejection revoked, store back under review' })
  async revokeRejection(
    @CurrentUser() user: RequestUser,
    @Param('id') storeId: string,
    @Body() dto: RevokeRejectionDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const data = await this.adminStoreService.revokeRejection(
      user.id,
      storeId,
      dto,
      ip,
      req.headers['user-agent'],
    );
    return { success: true, data };
  }

  // --------------------------------------------------------------------------
  // POST /admin/store-approvals/:id/suspend
  // --------------------------------------------------------------------------
  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:suspend')
  @UseGuards(StepUpGuard)
  @RequireStepUp()
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiOperation({ summary: 'Suspend an APPROVED store' })
  @ApiResponse({ status: 200, description: 'Store suspended' })
  async suspendStore(
    @CurrentUser() user: RequestUser,
    @Param('id') storeId: string,
    @Body() dto: SuspendStoreDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const data = await this.adminStoreService.suspendStore(
      user.id,
      storeId,
      dto,
      ip,
      req.headers['user-agent'],
    );
    return { success: true, data };
  }

  // --------------------------------------------------------------------------
  // POST /admin/store-approvals/:id/reinstate
  // --------------------------------------------------------------------------
  @Post(':id/reinstate')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:approve')
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiOperation({ summary: 'Reinstate a SUSPENDED store back to APPROVED' })
  @ApiResponse({ status: 200, description: 'Store reinstated' })
  async reinstateStore(
    @CurrentUser() user: RequestUser,
    @Param('id') storeId: string,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const data = await this.adminStoreService.reinstateStore(
      user.id,
      storeId,
      ip,
      req.headers['user-agent'],
    );
    return { success: true, data };
  }

  // --------------------------------------------------------------------------
  // POST /admin/store-approvals/:id/delete
  // --------------------------------------------------------------------------
  @Post(':id/delete')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:suspend')
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiOperation({ summary: 'Soft-delete a store — removes it from buyer discovery permanently' })
  @ApiResponse({ status: 200, description: 'Store deleted' })
  async deleteStore(
    @CurrentUser() user: RequestUser,
    @Param('id') storeId: string,
    @Body() dto: DeleteStoreDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const data = await this.adminStoreService.deleteStore(
      user.id,
      storeId,
      dto,
      ip,
      req.headers['user-agent'],
    );
    return { success: true, data };
  }
}
