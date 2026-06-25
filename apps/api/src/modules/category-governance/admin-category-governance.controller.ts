import {
  Body,
  Controller,
  Delete,
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
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { AdminCategoryGovernanceService } from './admin-category-governance.service';
import {
  CreateGlobalCategoryDto,
  ListCategoryRequestsDto,
  RejectCategoryRequestDto,
  RequestCategoryDocumentsDto,
  RevokeCategoryRejectionDto,
  UpdateGlobalCategoryDto,
  BulkCategoryRequestActionDto,
} from './dto/category-governance.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminCategoryGovernanceController {
  constructor(private readonly service: AdminCategoryGovernanceService) {}

  @Get('categories')
  @Permissions('categories:read')
  @ApiOperation({ summary: 'List global platform categories' })
  async listCategories() {
    const data = await this.service.listGlobalCategories();
    return { success: true, data };
  }

  @Post('categories')
  @Permissions('categories:manage')
  @ApiOperation({ summary: 'Create a global category or subcategory' })
  async createCategory(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateGlobalCategoryDto,
  ) {
    const data = await this.service.createGlobalCategory(dto, user.id);
    return { success: true, data };
  }

  @Patch('categories/:id')
  @Permissions('categories:manage')
  @ApiOperation({ summary: 'Update a global category' })
  async updateCategory(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateGlobalCategoryDto,
    @Ip() ip: string,
  ) {
    const data = await this.service.updateGlobalCategory(id, dto, user.id);
    return { success: true, data };
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions('categories:manage')
  @ApiOperation({ summary: 'Soft-delete a global category (cascades to subcategories)' })
  async deleteCategory(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Ip() ip: string,
  ) {
    const data = await this.service.softDeleteGlobalCategory(id, user.id);
    return { success: true, data };
  }

  @Get('categories/statistics')
  @Permissions('categories:read')
  @ApiOperation({ summary: 'Category governance statistics' })
  async getCategoryStatistics() {
    const data = await this.service.getCategoryStatistics();
    return { success: true, data };
  }

  @Get('category-requests')
  @Permissions('categories:approve')
  @ApiOperation({ summary: 'List merchant category access requests' })
  async listRequests(@Query() dto: ListCategoryRequestsDto) {
    const { requests, total } = await this.service.listCategoryRequests(dto);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    return {
      success: true,
      data: requests,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get('category-requests/:id')
  @Permissions('categories:approve')
  @ApiOperation({ summary: 'Get category request detail' })
  async getRequest(@Param('id') id: string) {
    const data = await this.service.getCategoryRequest(id);
    return { success: true, data };
  }

  @Post('category-requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  @Permissions('categories:approve')
  @ApiOperation({ summary: 'Approve merchant category access' })
  async approve(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Ip() ip: string,
  ) {
    const data = await this.service.approveCategoryRequest(id, user.id, ip);
    return { success: true, data };
  }

  @Post('category-requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  @Permissions('categories:approve')
  @ApiOperation({ summary: 'Reject merchant category access' })
  async reject(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: RejectCategoryRequestDto,
    @Ip() ip: string,
  ) {
    const data = await this.service.rejectCategoryRequest(id, user.id, dto, ip);
    return { success: true, data };
  }

  @Post('category-requests/:id/request-documents')
  @HttpCode(HttpStatus.OK)
  @Permissions('categories:approve')
  @ApiOperation({ summary: 'Request compliance documents for category access' })
  async requestDocuments(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: RequestCategoryDocumentsDto,
    @Ip() ip: string,
  ) {
    const data = await this.service.requestCategoryDocuments(id, user.id, dto, ip);
    return { success: true, data };
  }

  @Post('category-requests/:id/revoke-rejection')
  @HttpCode(HttpStatus.OK)
  @Permissions('categories:approve')
  @ApiOperation({ summary: 'Revoke a category rejection and reopen request' })
  async revokeRejection(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: RevokeCategoryRejectionDto,
    @Ip() ip: string,
  ) {
    const data = await this.service.revokeCategoryRejection(id, user.id, dto, ip);
    return { success: true, data };
  }

  @Post('category-requests/:id/move-to-review')
  @HttpCode(HttpStatus.OK)
  @Permissions('categories:approve')
  @ApiOperation({ summary: 'Move a pending category request to under review' })
  async moveToReview(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Ip() ip: string,
  ) {
    const data = await this.service.moveCategoryRequestToReview(id, user.id, ip);
    return { success: true, data };
  }

  @Post('category-requests/:id/revoke-approval')
  @HttpCode(HttpStatus.OK)
  @Permissions('categories:approve')
  @ApiOperation({ summary: 'Revoke an approved store category grant' })
  async revokeApproval(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: RejectCategoryRequestDto,
    @Ip() ip: string,
  ) {
    const data = await this.service.revokeCategoryApproval(id, user.id, dto, ip);
    return { success: true, data };
  }

  @Post('category-requests/bulk')
  @HttpCode(HttpStatus.OK)
  @Permissions('categories:approve')
  @ApiOperation({ summary: 'Bulk approve/reject/request-documents/move-to-review' })
  async bulkAction(
    @CurrentUser() user: RequestUser,
    @Body() dto: BulkCategoryRequestActionDto,
    @Ip() ip: string,
  ) {
    const data = await this.service.bulkCategoryRequestAction(
      dto.requestIds,
      dto.action,
      user.id,
      { reason: dto.reason, documentTypes: dto.documentTypes },
      ip,
    );
    return { success: true, data };
  }
}
