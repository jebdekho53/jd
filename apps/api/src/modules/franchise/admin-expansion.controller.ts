import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExpansionLeadStatus, FranchisePartnerStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { FranchiseService } from './franchise.service';
import { TerritoryService } from './territory.service';
import { ExpansionService } from './expansion.service';
import { FranchiseAnalyticsService } from './franchise-analytics.service';
import { FranchiseSettlementService } from './franchise-settlement.service';
import { FranchiseApplicationService } from './franchise-application.service';
import { FranchisePayoutService } from './franchise-payout.service';
import { FranchiseBankAccountService } from './franchise-bank-account.service';
import { FranchiseKycService } from './franchise-kyc.service';
import {
  ApproveExpansionLeadDto,
  CreateCityLaunchDto,
  CreateFranchiseDto,
  GenerateFranchiseSettlementsDto,
  RejectExpansionLeadDto,
  RejectFranchiseDocumentDto,
  ResolveStoreLinkDto,
  ResolveTerritoryConflictDto,
  UpdateFranchiseDto,
} from './dto/franchise.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/expansion')
export class AdminExpansionController {
  constructor(
    private readonly franchise: FranchiseService,
    private readonly territory: TerritoryService,
    private readonly expansion: ExpansionService,
    private readonly analytics: FranchiseAnalyticsService,
    private readonly settlements: FranchiseSettlementService,
    private readonly applications: FranchiseApplicationService,
    private readonly payouts: FranchisePayoutService,
    private readonly bankAccounts: FranchiseBankAccountService,
    private readonly kyc: FranchiseKycService,
  ) {}

  @Get('overview')
  @Permissions('settlements:read')
  async overview() {
    const [franchiseOverview, cities, conflicts, revenue, franchises] = await Promise.all([
      this.franchise.getOverview(),
      this.expansion.listCities(),
      this.territory.listConflicts(),
      this.settlements.listAllSettlements(),
      this.franchise.listFranchises(),
    ]);
    return { success: true, data: { ...franchiseOverview, cities, conflicts, revenue, franchises } };
  }

  @Get('cities')
  @Permissions('settlements:read')
  async cities() {
    return { success: true, data: await this.expansion.listCities() };
  }

  @Get('franchises')
  @Permissions('settlements:read')
  async franchises(@Query('status') status?: FranchisePartnerStatus) {
    return { success: true, data: await this.franchise.listFranchises(status) };
  }

  @Get('conflicts')
  @Permissions('settlements:read')
  async conflicts() {
    return { success: true, data: await this.territory.listConflicts() };
  }

  @Post('franchise')
  @Permissions('settlements:manage')
  async createFranchise(@Body() dto: CreateFranchiseDto) {
    return { success: true, data: await this.franchise.createFranchise(dto) };
  }

  @Patch('franchise/:id')
  @Permissions('settlements:manage')
  async updateFranchise(
    @Param('id') id: string,
    @Body() dto: UpdateFranchiseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return { success: true, data: await this.franchise.updateFranchise(id, dto, user.id) };
  }

  @Post('city-launch')
  @Permissions('settlements:manage')
  async cityLaunch(@Body() dto: CreateCityLaunchDto) {
    const plan = await this.expansion.createCityLaunch(dto);
    await this.expansion.triggerLaunchCampaign(dto.city, dto.state);
    return { success: true, data: plan };
  }

  // ---------------------------------------------------------------------------
  // Franchise application review
  // ---------------------------------------------------------------------------

  @Get('leads')
  @Permissions('settlements:read')
  async leads(@Query('status') status?: ExpansionLeadStatus) {
    return { success: true, data: await this.applications.listLeads(status) };
  }

  @Post('leads/:id/conflicts')
  @Permissions('settlements:read')
  async leadConflicts(@Param('id') id: string, @Body() dto: ApproveExpansionLeadDto) {
    return { success: true, data: await this.applications.previewConflicts(id, dto) };
  }

  /**
   * Approve a lead into a live partner. Returns `hasConflicts` when the requested
   * pincodes overlap another partner's exclusive territory — the territory and its
   * TerritoryConflict rows commit together, so the admin sees the clash rather than
   * an overlap being created silently.
   */
  @Patch('leads/:id/approve')
  @Permissions('settlements:manage')
  async approveLead(
    @Param('id') id: string,
    @Body() dto: ApproveExpansionLeadDto,
    @CurrentUser() user: RequestUser,
  ) {
    return { success: true, data: await this.applications.approveLead(user.id, id, dto) };
  }

  @Patch('leads/:id/reject')
  @Permissions('settlements:manage')
  async rejectLead(
    @Param('id') id: string,
    @Body() dto: RejectExpansionLeadDto,
    @CurrentUser() user: RequestUser,
  ) {
    return { success: true, data: await this.applications.rejectLead(user.id, id, dto) };
  }

  @Post('settlements/generate')
  @Permissions('settlements:manage')
  async generateSettlements(@Body() dto: GenerateFranchiseSettlementsDto) {
    return {
      success: true,
      data: await this.settlements.generateSettlements(
        new Date(dto.periodStart),
        new Date(dto.periodEnd),
        dto.franchiseId,
      ),
    };
  }

  /**
   * Actually send the money. Idempotent on the settlement, and the settlement is
   * only marked PAID once the transfer really succeeds.
   *
   * This replaces the old `markPaid()` status-flip, which reported a partner as
   * paid without a single rupee having moved.
   */
  @Patch('settlements/:id/pay')
  @Permissions('settlements:manage')
  async paySettlement(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return { success: true, data: await this.payouts.payoutSettlement(user.id, id) };
  }

  // ---------------------------------------------------------------------------
  // Conflict resolution — a parked attribution earns the partner nothing until
  // someone decides here, so this is the queue that actually moves money.
  // ---------------------------------------------------------------------------

  @Get('store-links/pending')
  @Permissions('settlements:read')
  async pendingStoreLinks() {
    return { success: true, data: await this.territory.listPendingStoreLinks() };
  }

  @Patch('store-links/:id/resolve')
  @Permissions('settlements:manage')
  async resolveStoreLink(
    @Param('id') id: string,
    @Body() dto: ResolveStoreLinkDto,
    @CurrentUser() user: RequestUser,
  ) {
    return { success: true, data: await this.territory.resolveStoreLink(user.id, id, dto) };
  }

  @Patch('conflicts/:id/resolve')
  @Permissions('settlements:manage')
  async resolveConflict(
    @Param('id') id: string,
    @Body() dto: ResolveTerritoryConflictDto,
    @CurrentUser() user: RequestUser,
  ) {
    return {
      success: true,
      data: await this.territory.resolveConflict(user.id, id, dto.resolution),
    };
  }

  @Get('leaderboard')
  @Permissions('settlements:read')
  async leaderboard() {
    return { success: true, data: await this.analytics.getLeaderboard() };
  }

  // ---------------------------------------------------------------------------
  // KYC document review
  // ---------------------------------------------------------------------------

  @Get('documents/pending')
  @Permissions('settlements:read')
  async pendingDocuments() {
    return { success: true, data: await this.kyc.listPendingDocuments() };
  }

  @Patch('documents/:id/verify')
  @Permissions('settlements:manage')
  async verifyDocument(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return { success: true, data: await this.kyc.verifyDocument(user.id, id) };
  }

  @Patch('documents/:id/reject')
  @Permissions('settlements:manage')
  async rejectDocument(
    @Param('id') id: string,
    @Body() dto: RejectFranchiseDocumentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return { success: true, data: await this.kyc.rejectDocument(user.id, id, dto) };
  }

  /** Verify a partner's bank account and create the Razorpay linked account. */
  @Patch('franchise/:id/bank-account/verify')
  @Permissions('settlements:manage')
  async verifyBankAccount(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return { success: true, data: await this.bankAccounts.verify(user.id, id) };
  }
}

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/analytics')
export class AdminFranchiseAnalyticsController {
  constructor(private readonly analytics: FranchiseAnalyticsService) {}

  @Get('franchise')
  @Permissions('analytics:read')
  async franchiseAnalytics() {
    return { success: true, data: await this.analytics.getAdminFranchiseAnalytics() };
  }
}
