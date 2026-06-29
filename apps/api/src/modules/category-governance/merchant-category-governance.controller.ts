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
  ApiTags,
} from '@nestjs/swagger';
import { CategoryCatalogKind } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { MerchantCategoryRequestService } from './merchant-category-request.service';
import {
  RequestCategoryAccessDto,
  RequestStoreCategoryAccessDto,
  UploadCategoryDocumentDto,
} from './dto/category-governance.dto';
import { StoreCategoryRequestService } from './store-category-request.service';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant')
export class MerchantCategoryGovernanceController {
  constructor(
    private readonly legacyService: MerchantCategoryRequestService,
    private readonly storeCategoryService: StoreCategoryRequestService,
  ) {}

  @Get('stores/:storeId/categories/catalog')
  @Permissions('categories:read')
  @ApiOperation({ summary: 'List global categories available to request for a store' })
  async listStoreCatalog(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Query('catalogKind') catalogKind?: CategoryCatalogKind,
  ) {
    const data = await this.storeCategoryService.listCatalog(user.id, storeId, catalogKind);
    return { success: true, data };
  }

  @Get('stores/:storeId/category-requests')
  @Permissions('categories:read')
  @ApiOperation({ summary: 'List store category access requests' })
  async listStoreRequests(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
  ) {
    const data = await this.storeCategoryService.listStoreRequests(user.id, storeId);
    return { success: true, data };
  }

  @Get('stores/:storeId/categories/approved')
  @Permissions('categories:read')
  @ApiOperation({ summary: 'List approved categories for product creation in a store' })
  async listStoreApproved(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Query('catalogKind') catalogKind?: CategoryCatalogKind,
  ) {
    const data = await this.storeCategoryService.listApprovedCategories(
      user.id,
      storeId,
      catalogKind,
    );
    return { success: true, data };
  }

  @Get('stores/:storeId/menu-categories/approved')
  @Permissions('categories:read')
  @ApiOperation({ summary: 'List approved menu subcategories for restaurant menu setup' })
  async listStoreApprovedMenuCategories(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
  ) {
    const data = await this.storeCategoryService.listApprovedCategories(
      user.id,
      storeId,
      CategoryCatalogKind.MENU,
    );
    return { success: true, data };
  }

  @Post('stores/:storeId/category-requests')
  @Permissions('categories:request')
  @ApiOperation({ summary: 'Request access to sell in a category/subcategory for a store' })
  async requestStoreAccess(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: RequestStoreCategoryAccessDto,
    @Ip() ip: string,
  ) {
    const data = await this.storeCategoryService.requestCategoryAccess(
      user.id,
      storeId,
      dto,
      ip,
    );
    return { success: true, data };
  }

  @Post('stores/:storeId/category-requests/:id/documents')
  @HttpCode(HttpStatus.OK)
  @Permissions('categories:request')
  @ApiOperation({ summary: 'Upload document for store category request' })
  async uploadStoreDocument(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: UploadCategoryDocumentDto,
    @Ip() ip: string,
  ) {
    const data = await this.storeCategoryService.uploadDocument(user.id, storeId, id, dto, ip);
    return { success: true, data };
  }

  @Post('stores/:storeId/category-requests/:id/submit-documents')
  @HttpCode(HttpStatus.OK)
  @Permissions('categories:request')
  @ApiOperation({ summary: 'Submit uploaded documents for admin review' })
  async submitStoreDocuments(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Ip() ip: string,
  ) {
    const data = await this.storeCategoryService.submitDocuments(user.id, storeId, id, ip);
    return { success: true, data };
  }

  @Get('categories/catalog')
  @Permissions('categories:read')
  @ApiOperation({ summary: 'List global categories (legacy — prefer store-scoped endpoint)' })
  async listCatalog(
    @CurrentUser() user: RequestUser,
    @Query('storeId') storeId?: string,
    @Query('catalogKind') catalogKind?: CategoryCatalogKind,
  ) {
    if (storeId) {
      const data = await this.storeCategoryService.listCatalog(user.id, storeId, catalogKind);
      return { success: true, data };
    }
    const data = await this.legacyService.listCatalog(user.id);
    return { success: true, data };
  }

  @Get('category-requests')
  @Permissions('categories:read')
  @ApiOperation({ summary: 'List category access requests' })
  async listMyRequests(
    @CurrentUser() user: RequestUser,
    @Query('storeId') storeId?: string,
  ) {
    if (storeId) {
      const data = await this.storeCategoryService.listStoreRequests(user.id, storeId);
      return { success: true, data };
    }
    const data = await this.legacyService.listMyRequests(user.id);
    return { success: true, data };
  }

  @Get('categories/approved')
  @Permissions('categories:read')
  @ApiOperation({ summary: 'List approved categories for product creation' })
  async listApproved(
    @CurrentUser() user: RequestUser,
    @Query('storeId') storeId: string,
    @Query('catalogKind') catalogKind?: CategoryCatalogKind,
  ) {
    if (!storeId) {
      const data = await this.legacyService.listApprovedCategories(user.id);
      return { success: true, data };
    }
    const data = await this.storeCategoryService.listApprovedCategories(
      user.id,
      storeId,
      catalogKind,
    );
    return { success: true, data };
  }

  @Post('category-requests')
  @Permissions('categories:request')
  @ApiOperation({ summary: 'Request access to sell in a category (legacy)' })
  async requestAccess(
    @CurrentUser() user: RequestUser,
    @Body() dto: RequestCategoryAccessDto,
    @Ip() ip: string,
    @Query('storeId') storeId?: string,
  ) {
    if (storeId && 'subcategoryId' in dto) {
      const data = await this.storeCategoryService.requestCategoryAccess(
        user.id,
        storeId,
        dto as unknown as RequestStoreCategoryAccessDto,
        ip,
      );
      return { success: true, data };
    }
    const data = await this.legacyService.requestCategoryAccess(user.id, dto, ip);
    return { success: true, data };
  }

  @Post('category-requests/:id/documents')
  @HttpCode(HttpStatus.OK)
  @Permissions('categories:request')
  @ApiOperation({ summary: 'Upload document for category request' })
  async uploadDocument(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UploadCategoryDocumentDto,
    @Ip() ip: string,
  ) {
    const data = await this.legacyService.uploadDocument(user.id, id, dto, ip);
    return { success: true, data };
  }

  @Post('category-requests/:id/submit-documents')
  @HttpCode(HttpStatus.OK)
  @Permissions('categories:request')
  @ApiOperation({ summary: 'Submit uploaded documents for admin review' })
  async submitDocuments(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Ip() ip: string,
  ) {
    const data = await this.legacyService.submitDocuments(user.id, id, ip);
    return { success: true, data };
  }
}
