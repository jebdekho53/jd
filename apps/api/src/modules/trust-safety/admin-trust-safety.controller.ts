import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FraudCaseCategory } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { TrustSafetyService } from './trust-safety.service';
import { TrustAlertService } from './trust-alert.service';
import { FraudCaseService } from './fraud-case.service';
import { AdminTrustActionDto, EnableCodDto, ListTrustQueryDto } from './dto/trust-safety.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/trust-safety')
export class AdminTrustSafetyController {
  constructor(
    private readonly trust: TrustSafetyService,
    private readonly alerts: TrustAlertService,
    private readonly cases: FraudCaseService,
  ) {}

  @Get('overview')
  @Permissions('settlements:read')
  @ApiOperation({ summary: 'Trust & safety dashboard' })
  async overview() {
    return { success: true, data: await this.trust.getDashboard() };
  }

  @Get('alerts')
  @Permissions('settlements:read')
  async listAlerts() {
    return { success: true, data: await this.alerts.listOpen() };
  }

  @Get('fraud-cases')
  @Permissions('settlements:read')
  async fraudCases(@Query() query: ListTrustQueryDto) {
    const data = await this.trust.listCases(query.category, query.page, query.limit);
    return { success: true, data };
  }

  @Get('fraud-cases/:category')
  @Permissions('settlements:read')
  async fraudCasesByCategory(@Param('category') category: FraudCaseCategory, @Query() query: ListTrustQueryDto) {
    const data = await this.trust.listCases(category, query.page, query.limit);
    return { success: true, data };
  }

  @Get('risk-profiles')
  @Permissions('settlements:read')
  async riskProfiles(@Query() query: ListTrustQueryDto) {
    return { success: true, data: await this.trust.listRiskProfiles(query.page, query.limit, query.status) };
  }

  @Get('blocked-accounts')
  @Permissions('settlements:read')
  async blocked(@Query() query: ListTrustQueryDto) {
    return { success: true, data: await this.trust.listBlockedAccounts(query.page, query.limit) };
  }

  @Post('actions')
  @Permissions('settlements:manage')
  async action(@CurrentUser() user: RequestUser, @Body() dto: AdminTrustActionDto) {
    const data = await this.trust.adminAction(user.id, dto.action, dto.userId, dto.reason, dto.caseId);
    return { success: true, data };
  }

  @Patch('cases/:id/resolve')
  @Permissions('settlements:manage')
  async resolveCase(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body('resolution') resolution: string,
    @Body('dismiss') dismiss?: boolean,
  ) {
    const data = await this.cases.resolveCase(id, user.id, resolution, dismiss);
    return { success: true, data };
  }

  @Post('cod/enable')
  @Permissions('settlements:manage')
  async enableCod(@CurrentUser() user: RequestUser, @Body() dto: EnableCodDto) {
    return { success: true, data: await this.trust.enableCodForBuyer(dto.userId, user.id) };
  }

  @Patch('alerts/:id/resolve')
  @Permissions('settlements:manage')
  async resolveAlert(@Param('id') id: string) {
    return { success: true, data: await this.alerts.resolve(id) };
  }
}
