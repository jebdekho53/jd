import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, CreateOfferDto, ListCampaignsDto, UpdateCampaignDto } from './dto/campaign.dto';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/stores')
export class MerchantCampaignController {
  constructor(private readonly campaigns: CampaignService) {}

  @Get(':storeId/campaigns')
  @Permissions('stores:read')
  async list(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Query() dto: ListCampaignsDto,
  ) {
    const result = await this.campaigns.listAdmin({ ...dto, storeId });
    return {
      success: true,
      data: result.campaigns,
      meta: { page: result.page, limit: result.limit, total: result.total },
    };
  }

  @Post(':storeId/campaigns')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('stores:update')
  async create(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    const data = await this.campaigns.createMerchantCampaign(user.id, storeId, dto);
    return { success: true, data };
  }

  @Get(':storeId/campaigns/:campaignId/performance')
  @Permissions('stores:read')
  async performance(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('campaignId') campaignId: string,
  ) {
    const data = await this.campaigns.merchantPerformance(user.id, storeId, campaignId);
    return { success: true, data };
  }

  @Post(':storeId/campaigns/:campaignId/pause')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:update')
  async pause(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('campaignId') campaignId: string,
  ) {
    const data = await this.campaigns.pauseCampaign(user.id, campaignId, storeId);
    return { success: true, data };
  }

  @Post(':storeId/campaigns/:campaignId/resume')
  @HttpCode(HttpStatus.OK)
  @Permissions('stores:update')
  async resume(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('campaignId') campaignId: string,
  ) {
    const data = await this.campaigns.resumeCampaign(user.id, campaignId, storeId);
    return { success: true, data };
  }

  @Patch(':storeId/campaigns/:campaignId')
  @Permissions('stores:update')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    const data = await this.campaigns.updateCampaign(user.id, campaignId, dto, storeId);
    return { success: true, data };
  }

  @Post(':storeId/campaigns/:campaignId/offers')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('stores:update')
  async addOffer(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateOfferDto,
  ) {
    const data = await this.campaigns.addOffer(user.id, storeId, campaignId, dto);
    return { success: true, data };
  }
}
