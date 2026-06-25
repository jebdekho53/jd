import { Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Ip, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventoryStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { InventoryService } from './inventory.service';
import { BulkAdjustInventoryDto, ListStoreInventoryDto } from './dto/inventory.dto';
import { UpdateInventoryDto } from '../product/dto/update-inventory.dto';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/stores/:storeId/inventory')
export class MerchantInventoryController {
  constructor(
    private readonly inventory: InventoryService,
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
  ) {}

  @Get()
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'List store inventory with filters' })
  async list(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Query() dto: ListStoreInventoryDto,
  ) {
    await this.assertStore(user.id, storeId);
    const data = await this.inventory.listStoreInventory({ storeId, ...dto });
    return { success: true, data };
  }

  @Patch('variants/:variantId')
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Adjust available stock for a variant' })
  async adjust(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateInventoryDto,
    @Ip() ip: string,
  ) {
    await this.assertVariantInStore(user.id, storeId, variantId);
    const data = await this.inventory.adjustAvailableQty(
      variantId,
      dto.quantity,
      dto.lowStockThreshold,
      user.id,
    );
    return { success: true, data };
  }

  @Post('bulk-adjust')
  @HttpCode(HttpStatus.OK)
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Bulk set available stock for multiple variants' })
  async bulkAdjust(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: BulkAdjustInventoryDto,
    @Ip() ip: string,
  ) {
    await this.assertStore(user.id, storeId);
    const results = [];
    for (const variantId of dto.variantIds) {
      await this.assertVariantInStore(user.id, storeId, variantId);
      results.push(
        await this.inventory.adjustAvailableQty(variantId, dto.availableQty, undefined, user.id),
      );
    }
    return { success: true, data: results };
  }

  @Patch('variants/:variantId/disable')
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Disable product variant inventory (stops sales)' })
  async disable(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('variantId') variantId: string,
  ) {
    await this.assertVariantInStore(user.id, storeId, variantId);
    await this.inventory.setStatus(variantId, InventoryStatus.DISABLED);
    return { success: true };
  }

  private async assertStore(userId: string, storeId: string) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
    });
    if (!store) throw new NotFoundException('Store not found');
  }

  private async assertVariantInStore(userId: string, storeId: string, variantId: string) {
    await this.assertStore(userId, storeId);
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, product: { storeId, deletedAt: null } },
    });
    if (!variant) throw new NotFoundException('Variant not found in store');
  }
}
