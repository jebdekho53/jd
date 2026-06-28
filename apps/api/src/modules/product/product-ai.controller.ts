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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { ProductAiService } from './product-ai.service';
import { AnalyzeProductImageDto, ConfirmAiProductDto, ListAiHistoryDto } from './dto/product-ai.dto';

const STORE_PARAM = ':storeId';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller(`merchant/stores/${STORE_PARAM}/products/ai`)
export class ProductAiController {
  constructor(private readonly aiService: ProductAiService) {}

  @Get('availability')
  @Permissions('products:read')
  @ApiParam({ name: 'storeId' })
  @ApiOperation({ summary: 'Check if AI product add is available' })
  async availability(@Param('storeId') _storeId: string) {
    const data = this.aiService.getAvailability();
    return { success: true, data };
  }

  @Get('billing')
  @Permissions('products:read')
  @ApiParam({ name: 'storeId' })
  @ApiOperation({ summary: 'AI product billing history for store' })
  async billing(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.aiService.listBilling(
      user.id,
      storeId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
    return { success: true, data };
  }

  @Post('analyze')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiOperation({ summary: 'Analyze product photo with AI (free preview)' })
  async analyze(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: AnalyzeProductImageDto,
    @Ip() ip: string,
  ) {
    const data = await this.aiService.analyzeImage(user.id, storeId, dto.dataUrl, ip);
    return { success: true, data };
  }

  @Get('history')
  @Permissions('products:read')
  @ApiParam({ name: 'storeId' })
  @ApiOperation({ summary: 'List AI product analysis history for merchant' })
  async history(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Query() query: ListAiHistoryDto,
  ) {
    const data = await this.aiService.listHistory(
      user.id,
      query.storeId ?? storeId,
      query.page,
      query.limit,
    );
    return { success: true, data };
  }

  @Get(':analysisId')
  @Permissions('products:read')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'analysisId' })
  @ApiOperation({ summary: 'Get AI analysis result' })
  async getAnalysis(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('analysisId') analysisId: string,
  ) {
    const data = await this.aiService.getAnalysis(user.id, storeId, analysisId);
    return { success: true, data };
  }

  @Post(':analysisId/confirm')
  @HttpCode(HttpStatus.OK)
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'analysisId' })
  @ApiOperation({ summary: 'Confirm AI suggestions and create product (paid)' })
  async confirm(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('analysisId') analysisId: string,
    @Body() dto: ConfirmAiProductDto,
    @Ip() ip: string,
  ) {
    const data = await this.aiService.confirmAnalysis(
      user.id,
      storeId,
      analysisId,
      dto,
      ip,
    );
    return { success: true, data };
  }

  @Post(':analysisId/cancel')
  @HttpCode(HttpStatus.OK)
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'analysisId' })
  @ApiOperation({ summary: 'Cancel AI analysis without charge' })
  async cancel(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('analysisId') analysisId: string,
    @Ip() ip: string,
  ) {
    const data = await this.aiService.cancelAnalysis(user.id, storeId, analysisId, ip);
    return { success: true, data };
  }
}
