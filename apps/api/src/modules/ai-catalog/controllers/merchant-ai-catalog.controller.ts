import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { RequestUser } from '../../../common/types';
import { ApiTags as Tags } from '../../../common/constants';
import { AiCatalogAnalysisService } from '../services/ai-catalog-analysis.service';
import { AiCatalogImageService } from '../services/ai-catalog-image.service';
import { AiCatalogConfigService } from '../services/ai-catalog-config.service';
import { AiCatalogBillingService } from '../services/ai-catalog-billing.service';
import { ConfirmCatalogDto, GenerateImagesDto, ImageActionDto, QueueAnalysisDto } from '../dto/ai-catalog.dto';

/**
 * Merchant-facing v2 API. Every route is scoped to a store the caller owns
 * (ownership is re-checked in the service layer — the storeId in the path is
 * never trusted). The v1 controller remains mounted and unchanged.
 */
@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/stores/:storeId/products/ai-catalog')
export class MerchantAiCatalogController {
  constructor(
    private readonly analysis: AiCatalogAnalysisService,
    private readonly images: AiCatalogImageService,
    private readonly config: AiCatalogConfigService,
    private readonly billing: AiCatalogBillingService,
  ) {}

  @Get('availability')
  @Permissions('products:read')
  @ApiParam({ name: 'storeId' })
  @ApiOperation({ summary: 'v2 availability + wallet + pricing' })
  async availability(@CurrentUser() user: RequestUser, @Param('storeId') _storeId: string) {
    return {
      success: true,
      data: {
        enabled: await this.config.isEnabled(),
        pricing: await this.config.pricing(),
        defaultOutputs: await this.config.defaultOutputs(),
      },
    };
  }

  @Post('analyze')
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiOperation({ summary: 'Queue an async product-image analysis' })
  async analyze(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: QueueAnalysisDto,
    @Ip() ip: string,
  ) {
    const data = await this.analysis.createAndQueue({
      userId: user.id,
      storeId,
      dataUrl: dto.dataUrl,
      ipAddress: ip,
      autoGenerateImages: dto.autoGenerateImages ?? true,
    });
    return { success: true, data };
  }

  @Get('analysis/:analysisId')
  @Permissions('products:read')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'analysisId' })
  @ApiOperation({ summary: 'Fetch analysis + attributes + image assets' })
  async getAnalysis(@CurrentUser() user: RequestUser, @Param('storeId') storeId: string, @Param('analysisId') analysisId: string) {
    const data = await this.analysis.getAnalysisView(user.id, storeId, analysisId);
    return { success: true, data };
  }

  @Get('jobs/:jobId')
  @Permissions('products:read')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'jobId' })
  @ApiOperation({ summary: 'Poll job status (source of truth after WS reconnect)' })
  async jobStatus(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    const data = await this.analysis.getJobStatus(user.id, jobId);
    return { success: true, data };
  }

  @Post('analysis/:analysisId/images')
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'analysisId' })
  @ApiOperation({ summary: 'Request (on-demand) image outputs; returns cost preview' })
  async generateImages(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('analysisId') analysisId: string,
    @Body() dto: GenerateImagesDto,
    @Ip() ip: string,
  ) {
    const data = await this.analysis.requestImages({
      userId: user.id,
      storeId,
      analysisId,
      outputTypes: dto.outputTypes,
      forceRegenerate: dto.forceRegenerate ?? false,
      ipAddress: ip,
    });
    return { success: true, data };
  }

  @Post('images/:assetId/action')
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'assetId' })
  @ApiOperation({ summary: 'Approve / reject / select a generated image asset' })
  async imageAction(@CurrentUser() user: RequestUser, @Param('assetId') assetId: string, @Body() dto: ImageActionDto) {
    if (dto.action === 'select') await this.images.selectAsset(user.id, assetId);
    else await this.images.approveAsset(user.id, assetId, dto.action === 'approve');
    return { success: true, data: { ok: true } };
  }

  @Post('analysis/:analysisId/confirm')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'analysisId' })
  @ApiOperation({ summary: 'Confirm → create product + normalize approved attributes' })
  async confirm(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('analysisId') analysisId: string,
    @Body() dto: ConfirmCatalogDto,
    @Ip() ip: string,
  ) {
    const data = await this.analysis.confirm({ userId: user.id, storeId, analysisId, dto, ipAddress: ip });
    return { success: true, data };
  }
}
