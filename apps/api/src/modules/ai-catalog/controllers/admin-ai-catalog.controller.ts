import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { RequestUser } from '../../../common/types';
import { ApiTags as Tags } from '../../../common/constants';
import { AiCatalogAdminService } from '../services/ai-catalog-admin.service';
import { AdminRefundDto, CreatePromptVersionDto, ModerationDecisionDto, SetConfigDto } from '../dto/ai-catalog.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/ai-catalog')
export class AdminAiCatalogController {
  constructor(private readonly admin: AiCatalogAdminService) {}

  @Get('queue-health')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Live queue counts + ledger health' })
  async queueHealth() {
    return { success: true, data: await this.admin.queueHealth() };
  }

  @Get('jobs/failed')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'List dead-lettered jobs' })
  async failedJobs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return { success: true, data: await this.admin.listFailedJobs(page ? Number(page) : 1, limit ? Number(limit) : 50) };
  }

  @Post('jobs/:jobId/redrive')
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Re-drive a failed job' })
  async redrive(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return { success: true, data: await this.admin.redriveJob(jobId, user.id) };
  }

  @Get('moderation')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'List analyses awaiting moderation' })
  async moderation(@Query('page') page?: string, @Query('limit') limit?: string) {
    return { success: true, data: await this.admin.listModeration(page ? Number(page) : 1, limit ? Number(limit) : 50) };
  }

  @Post('moderation/:analysisId')
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Approve/reject a moderated analysis' })
  async resolve(@CurrentUser() user: RequestUser, @Param('analysisId') analysisId: string, @Body() dto: ModerationDecisionDto) {
    return { success: true, data: await this.admin.resolveModeration(analysisId, dto.approve, dto.reason, user.id) };
  }

  @Get('config')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Current AI catalog config (flag, pricing, thresholds)' })
  async getConfig() {
    return { success: true, data: await this.admin.getConfig() };
  }

  @Post('config')
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Set a config value (feature flag, pricing, thresholds…)' })
  async setConfig(@CurrentUser() user: RequestUser, @Body() dto: SetConfigDto) {
    return { success: true, data: await this.admin.setConfig(dto.key, dto.value, user.id) };
  }

  @Get('prompts/:kind')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'List prompt versions for a kind' })
  async prompts(@Param('kind') kind: string) {
    return { success: true, data: await this.admin.listPromptVersions(kind) };
  }

  @Post('prompts')
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Create + activate a new prompt version' })
  async createPrompt(@CurrentUser() user: RequestUser, @Body() dto: CreatePromptVersionDto) {
    return { success: true, data: await this.admin.createPromptVersion(dto.kind, dto.content, dto.notes, user.id) };
  }

  @Post('refund')
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Refund a generated-image charge' })
  async refund(@CurrentUser() user: RequestUser, @Body() dto: AdminRefundDto) {
    return { success: true, data: await this.admin.refund(dto.merchantProfileId, dto.imageAssetId, dto.reason, user.id) };
  }

  @Get('billing/:merchantProfileId')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Wallet transaction audit for a merchant' })
  async billing(@Param('merchantProfileId') merchantProfileId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return { success: true, data: await this.admin.billingAudit(merchantProfileId, page ? Number(page) : 1, limit ? Number(limit) : 50) };
  }
}
