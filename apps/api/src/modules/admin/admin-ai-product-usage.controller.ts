import { Controller, Get, Header, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AIProductAnalysisStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { AdminAiProductUsageService } from './admin-ai-product-usage.service';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/ai-product-usage')
export class AdminAiProductUsageController {
  constructor(private readonly usage: AdminAiProductUsageService) {}

  @Get('stats')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'AI product usage summary stats' })
  async stats(
    @Query('merchantProfileId') merchantProfileId?: string,
    @Query('storeId') storeId?: string,
  ) {
    const data = await this.usage.getStats({ merchantProfileId, storeId });
    return { success: true, data };
  }

  @Get('export')
  @Permissions('inventory:read')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="ai-product-usage.csv"')
  @ApiOperation({ summary: 'Export AI product usage as CSV' })
  async exportCsv(
    @Query('status') status?: AIProductAnalysisStatus,
    @Query('merchantProfileId') merchantProfileId?: string,
    @Query('storeId') storeId?: string,
    @Query('lowConfidence') lowConfidence?: string,
    @Query('charged') charged?: string,
    @Query('failed') failed?: string,
  ) {
    return this.usage.exportCsv({
      status,
      merchantProfileId,
      storeId,
      lowConfidence: lowConfidence === 'true',
      charged: charged === 'true',
      failed: failed === 'true',
    });
  }

  @Get()
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'List AI product usage across merchants' })
  async list(
    @Query('status') status?: AIProductAnalysisStatus,
    @Query('merchantProfileId') merchantProfileId?: string,
    @Query('storeId') storeId?: string,
    @Query('lowConfidence') lowConfidence?: string,
    @Query('charged') charged?: string,
    @Query('failed') failed?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.usage.list({
      status,
      merchantProfileId,
      storeId,
      lowConfidence: lowConfidence === 'true',
      charged: charged === 'true',
      failed: failed === 'true',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    return { success: true, data };
  }

  @Get(':analysisId')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'AI product analysis detail' })
  async detail(@Param('analysisId') analysisId: string) {
    const data = await this.usage.getDetail(analysisId);
    return { success: true, data };
  }
}
