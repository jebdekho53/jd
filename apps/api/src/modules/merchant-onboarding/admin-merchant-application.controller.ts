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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { MerchantOnboardingService } from './merchant-onboarding.service';
import {
  ListMerchantApplicationsDto,
  RejectApplicationDto,
  RequestApplicationChangesDto,
  RequestApplicationDocumentsDto,
  ScheduleCallDto,
} from './dto/merchant-onboarding.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/merchant-applications')
export class AdminMerchantApplicationController {
  constructor(private readonly onboarding: MerchantOnboardingService) {}

  @Get()
  @ApiOperation({ summary: 'List merchant applications' })
  async list(@Query() query: ListMerchantApplicationsDto) {
    const data = await this.onboarding.listApplications(query);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get merchant application detail' })
  async get(@Param('id') id: string) {
    const data = await this.onboarding.getApplication(id);
    return { success: true, data };
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@CurrentUser() admin: RequestUser, @Param('id') id: string, @Ip() ip: string) {
    const data = await this.onboarding.approveApplication(admin.id, id, ip);
    return { success: true, data };
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @CurrentUser() admin: RequestUser,
    @Param('id') id: string,
    @Body() dto: RejectApplicationDto,
    @Ip() ip: string,
  ) {
    const data = await this.onboarding.rejectApplication(admin.id, id, dto, ip);
    return { success: true, data };
  }

  @Post(':id/request-documents')
  @HttpCode(HttpStatus.OK)
  async requestDocuments(
    @CurrentUser() admin: RequestUser,
    @Param('id') id: string,
    @Body() dto: RequestApplicationDocumentsDto,
    @Ip() ip: string,
  ) {
    const data = await this.onboarding.requestDocuments(admin.id, id, dto, ip);
    return { success: true, data };
  }

  @Post(':id/request-changes')
  @HttpCode(HttpStatus.OK)
  async requestChanges(
    @CurrentUser() admin: RequestUser,
    @Param('id') id: string,
    @Body() dto: RequestApplicationChangesDto,
  ) {
    const data = await this.onboarding.requestChanges(admin.id, id, dto);
    return { success: true, data };
  }

  @Post(':id/schedule-call')
  @HttpCode(HttpStatus.OK)
  async scheduleCall(
    @CurrentUser() admin: RequestUser,
    @Param('id') id: string,
    @Body() dto: ScheduleCallDto,
  ) {
    const data = await this.onboarding.scheduleCall(admin.id, id, dto);
    return { success: true, data };
  }
}
