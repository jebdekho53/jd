import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { AdminProductService } from './admin-product.service';
import { ListStoreProductsDto } from './dto/list-store-products.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/products')
export class AdminProductController {
  constructor(private readonly products: AdminProductService) {}

  @Get()
  @Permissions('inventory:read')
  @ApiOperation({ summary: "List a specific store's products" })
  async list(@Query() dto: ListStoreProductsDto) {
    const { products, total } = await this.products.listProductsByStore(dto);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    return {
      success: true,
      data: products,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get(':id')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Product audit detail for admin review' })
  async detail(@Param('id') id: string) {
    const data = await this.products.getProductAudit(id);
    return { success: true, data };
  }
}
