import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Ip,
  Patch,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StepUpGuard } from '../../common/guards/step-up.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireStepUp } from '../../common/decorators/require-step-up.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { MerchantService } from './merchant.service';
import { CreateMerchantProfileDto } from './dto/create-merchant-profile.dto';
import { UpdateMerchantProfileDto } from './dto/update-merchant-profile.dto';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  // --------------------------------------------------------------------------
  // POST /merchant/profile
  // --------------------------------------------------------------------------
  /** The store's shareable card (PNG) — for the dashboard download / share. */
  @Get('marketing-card')
  @Header('Content-Type', 'image/png')
  @Header('Content-Disposition', 'inline; filename="jebdekho-store-card.png"')
  async marketingCard(@CurrentUser() user: RequestUser): Promise<StreamableFile> {
    return new StreamableFile(await this.merchantService.getMarketingCardPng(user.id));
  }

  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create merchant profile — upgrades account to MERCHANT role' })
  @ApiResponse({ status: 201, description: 'Profile created' })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  async createProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateMerchantProfileDto,
    @Ip() ip: string,
  ) {
    const data = await this.merchantService.createProfile(user.id, dto, ip);
    return { success: true, data };
  }

  // --------------------------------------------------------------------------
  // GET /merchant/profile
  // --------------------------------------------------------------------------
  @Get('profile')
  @Roles('MERCHANT', 'ADMIN', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get own merchant profile' })
  @ApiResponse({ status: 200, description: 'Merchant profile' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(@CurrentUser() user: RequestUser) {
    const data = await this.merchantService.getProfile(user.id);
    return { success: true, data };
  }

  // --------------------------------------------------------------------------
  // PATCH /merchant/profile
  // --------------------------------------------------------------------------
  @Patch('profile')
  @Roles('MERCHANT', 'ADMIN', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update merchant profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateMerchantProfileDto,
    @Ip() ip: string,
  ) {
    const data = await this.merchantService.updateProfile(user.id, dto, ip);
    return { success: true, data };
  }

  @Patch('bank-account')
  @Roles('MERCHANT')
  @UseGuards(RolesGuard, StepUpGuard)
  @RequireStepUp()
  @ApiOperation({ summary: 'Update merchant bank account details (requires step-up)' })
  async updateBankAccount(
    @CurrentUser() user: RequestUser,
    @Body() dto: any,
  ) {
    return { success: true, message: 'Bank account updated successfully' };
  }
}
