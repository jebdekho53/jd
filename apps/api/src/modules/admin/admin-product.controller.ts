import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { AdminProductService } from './admin-product.service';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/products')
export class AdminProductController {
  constructor(private readonly products: AdminProductService) {}

  @Get(':id')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Product audit detail for admin review' })
  async detail(@Param('id') id: string) {
    const data = await this.products.getProductAudit(id);
    return { success: true, data };
  }
}
