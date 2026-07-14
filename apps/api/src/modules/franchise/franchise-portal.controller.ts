import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { FranchiseService } from './franchise.service';
import { FranchiseAnalyticsService } from './franchise-analytics.service';
import { FranchiseSettlementService } from './franchise-settlement.service';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('FRANCHISE')
@Controller('franchise')
export class FranchisePortalController {
  constructor(
    private readonly franchise: FranchiseService,
    private readonly analytics: FranchiseAnalyticsService,
    private readonly settlements: FranchiseSettlementService,
  ) {}

  @Get('dashboard')
  async dashboard(@CurrentUser() user: RequestUser) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    return { success: true, data: await this.analytics.getFranchiseDashboard(id) };
  }

  /** The partner's invite link — the top of the whole acquisition funnel. */
  @Get('referral')
  async referral(@CurrentUser() user: RequestUser) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    return { success: true, data: await this.franchise.getReferral(id) };
  }

  /** Merchants recruited via this partner's referral code, and their status. */
  @Get('pipeline')
  async pipeline(@CurrentUser() user: RequestUser) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    return { success: true, data: await this.franchise.getPipeline(id) };
  }

  @Get('stores')
  async stores(@CurrentUser() user: RequestUser) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    const [dash, links] = await Promise.all([
      this.analytics.getFranchiseDashboard(id),
      this.franchise.getLinkedStores(id),
    ]);
    // links surfaces PENDING_REVIEW attributions with their conflict_reason, so a
    // partner can see a disputed store rather than silently not being paid for it.
    return { success: true, data: { ...dash, links } };
  }

  @Get('territory')
  async territory(@CurrentUser() user: RequestUser) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    const dash = await this.analytics.getFranchiseDashboard(id);
    return {
      success: true,
      data: { territories: dash?.territories ?? [], pincodes: dash?.pincodes ?? [] },
    };
  }

  @Get('finance')
  async finance(@CurrentUser() user: RequestUser) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    return { success: true, data: await this.settlements.listSettlements(id) };
  }
}
