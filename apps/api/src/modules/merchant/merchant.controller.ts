import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
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
}
