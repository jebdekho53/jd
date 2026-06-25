import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { InventoryService } from './inventory.service';
import { ListAdminInventoryDto } from './dto/inventory.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/inventory')
export class AdminInventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Audit view of all store inventory (read-only)' })
  async list(@Query() dto: ListAdminInventoryDto) {
    const data = await this.inventory.listAdminInventory(dto);
    return { success: true, data };
  }

  @Get('analytics')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Global inventory analytics' })
  async analytics() {
    const data = await this.inventory.getGlobalAnalytics();
    return { success: true, data };
  }
}
