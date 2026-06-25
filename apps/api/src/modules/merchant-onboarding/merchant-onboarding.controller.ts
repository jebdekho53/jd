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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { MerchantOnboardingService } from './merchant-onboarding.service';
import {
  FranchiseLeadDto,
  SaveBankAccountDto,
  UpdateOnboardingStepDto,
  UploadMerchantDocumentDto,
  ValidateGstDto,
} from './dto/merchant-onboarding.dto';

@ApiTags(Tags.MERCHANTS)
@Controller('merchant/onboarding')
export class MerchantOnboardingController {
  constructor(private readonly onboarding: MerchantOnboardingService) {}

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Public merchant landing statistics' })
  async getStats() {
    const data = await this.onboarding.getPublicStats();
    return { success: true, data };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('application')
  async getApplication(@CurrentUser() user: RequestUser) {
    const data = await this.onboarding.getOrCreateApplication(user.id);
    return { success: true, data };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('application')
  async updateStep(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateOnboardingStepDto,
    @Ip() ip: string,
  ) {
    const data = await this.onboarding.updateStep(user.id, dto, ip);
    return { success: true, data };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('application/documents')
  @HttpCode(HttpStatus.CREATED)
  async uploadDocument(@CurrentUser() user: RequestUser, @Body() dto: UploadMerchantDocumentDto) {
    const data = await this.onboarding.uploadDocument(user.id, dto);
    return { success: true, data };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('application/bank')
  @HttpCode(HttpStatus.OK)
  async saveBank(@CurrentUser() user: RequestUser, @Body() dto: SaveBankAccountDto) {
    const data = await this.onboarding.saveBankAccount(user.id, dto);
    return { success: true, data };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('application/validate-gst')
  @HttpCode(HttpStatus.OK)
  validateGst(@Body() dto: ValidateGstDto) {
    const data = this.onboarding.validateGst(dto.gstNumber);
    return { success: true, data };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('application/submit')
  @HttpCode(HttpStatus.OK)
  async submit(@CurrentUser() user: RequestUser, @Ip() ip: string) {
    const data = await this.onboarding.submitApplication(user.id, ip);
    return { success: true, data };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status(@CurrentUser() user: RequestUser) {
    const data = await this.onboarding.getApplicationStatus(user.id);
    return { success: true, data };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('checklist')
  async checklist(@CurrentUser() user: RequestUser) {
    const data = await this.onboarding.getPostApprovalChecklist(user.id);
    return { success: true, data };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('franchise-lead')
  @HttpCode(HttpStatus.CREATED)
  async franchiseLead(@CurrentUser() user: RequestUser, @Body() dto: FranchiseLeadDto) {
    return this.onboarding.submitFranchiseLead(user.id, dto);
  }
}
