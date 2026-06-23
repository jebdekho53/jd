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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ListStoresDto } from './dto/list-stores.dto';

@ApiTags(Tags.STORES)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // --------------------------------------------------------------------------
  // POST /merchant/stores
  // --------------------------------------------------------------------------
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('stores:write')
  @ApiOperation({ summary: 'Create a new store in DRAFT status' })
  @ApiResponse({ status: 201, description: 'Store created' })
  async createStore(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateStoreDto,
    @Ip() ip: string,
  ) {
    const data = await this.storeService.createStore(user.id, dto, ip);
    return { success: true, data };
  }

  // --------------------------------------------------------------------------
  // GET /merchant/stores
  // --------------------------------------------------------------------------
  @Get()
  @Permissions('stores:read')
  @ApiOperation({ summary: 'List all stores for the authenticated merchant' })
  @ApiResponse({ status: 200, description: 'Store list' })
  async listStores(
    @CurrentUser() user: RequestUser,
    @Query() query: ListStoresDto,
  ) {
    const { stores, total } = await this.storeService.listStores(user.id, query);
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
  // GET /merchant/stores/:id
  // --------------------------------------------------------------------------
  @Get(':id')
  @Permissions('stores:read')
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiOperation({ summary: 'Get a single store (must be owned by merchant)' })
  @ApiResponse({ status: 200, description: 'Store detail' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @ApiResponse({ status: 403, description: 'Not your store' })
  async getStore(
    @CurrentUser() user: RequestUser,
    @Param('id') storeId: string,
  ) {
    const data = await this.storeService.getStore(user.id, storeId);
    return { success: true, data };
  }

  // --------------------------------------------------------------------------
  // PATCH /merchant/stores/:id
  // --------------------------------------------------------------------------
  @Patch(':id')
  @Permissions('stores:write')
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiOperation({ summary: 'Update store — full edit for DRAFT/REJECTED, settings-only for APPROVED' })
  @ApiResponse({ status: 200, description: 'Store updated' })
  @ApiResponse({ status: 403, description: 'Cannot edit in current status or not owner' })
  async updateStore(
    @CurrentUser() user: RequestUser,
    @Param('id') storeId: string,
    @Body() dto: UpdateStoreDto,
    @Ip() ip: string,
  ) {
    const data = await this.storeService.updateStore(user.id, storeId, dto, ip);
    return { success: true, data };
  }

  // --------------------------------------------------------------------------
  // POST /merchant/stores/:id/submit-review
  // --------------------------------------------------------------------------
  @Post(':id/submit-review')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:submit')
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiOperation({ summary: 'Submit DRAFT/REJECTED store for admin review' })
  @ApiResponse({ status: 200, description: 'Store submitted — status: PENDING_REVIEW' })
  @ApiResponse({ status: 400, description: 'Store not ready (missing required fields)' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async submitForReview(
    @CurrentUser() user: RequestUser,
    @Param('id') storeId: string,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const data = await this.storeService.submitForReview(user.id, storeId, ip);
    return { success: true, data };
  }
}
