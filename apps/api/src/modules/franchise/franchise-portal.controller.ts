import { Body, Controller, Get, Header, Post, Put, Req, StreamableFile, UseGuards } from '@nestjs/common';
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
import { FranchiseBankAccountService } from './franchise-bank-account.service';
import { FranchisePayoutService } from './franchise-payout.service';
import { FranchiseKycService } from './franchise-kyc.service';
import {
  AcceptFranchiseAgreementDto,
  SaveFranchiseBankAccountDto,
  SaveFranchiseProfileDto,
  UploadFranchiseDocumentDto,
} from './dto/franchise.dto';

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
    private readonly bankAccounts: FranchiseBankAccountService,
    private readonly payouts: FranchisePayoutService,
    private readonly kyc: FranchiseKycService,
  ) {}

  /** Where this partner stands against everyone else. */
  @Get('leaderboard')
  async leaderboard(@CurrentUser() user: RequestUser) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    return { success: true, data: await this.analytics.getMyStanding(id) };
  }

  /** What is still missing before this partner can be paid. */
  @Get('kyc')
  async kycStatus(@CurrentUser() user: RequestUser) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    return { success: true, data: await this.kyc.getKycStatus(id) };
  }

  @Post('documents')
  async uploadDocument(
    @CurrentUser() user: RequestUser,
    @Body() dto: UploadFranchiseDocumentDto,
  ) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    return { success: true, data: await this.kyc.uploadDocument(id, dto) };
  }

  @Post('agreement/accept')
  async acceptAgreement(
    @CurrentUser() user: RequestUser,
    @Body() dto: AcceptFranchiseAgreementDto,
    @Req() req: { ip?: string },
  ) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    return { success: true, data: await this.kyc.acceptAgreement(id, dto, req.ip) };
  }

  /** The account the partner's money is paid into. Never returns the full number. */
  @Get('bank-account')
  async getBankAccount(@CurrentUser() user: RequestUser) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    return { success: true, data: await this.bankAccounts.get(id) };
  }

  /** Adding or changing the account resets verification — it must be re-checked. */
  @Put('bank-account')
  async saveBankAccount(
    @CurrentUser() user: RequestUser,
    @Body() dto: SaveFranchiseBankAccountDto,
  ) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    return { success: true, data: await this.bankAccounts.save(id, dto) };
  }

  /** Actual transfers, with the Razorpay id and the account they landed in. */
  @Get('payouts')
  async listPayouts(@CurrentUser() user: RequestUser) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    return { success: true, data: await this.payouts.listPayouts(id) };
  }

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

  /** Card details the partner edits (full address + owner photo). */
  @Get('profile')
  async getProfile(@CurrentUser() user: RequestUser) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    return { success: true, data: await this.franchise.getProfile(id) };
  }

  @Put('profile')
  async saveProfile(@CurrentUser() user: RequestUser, @Body() dto: SaveFranchiseProfileDto) {
    const id = await this.franchise.resolveFranchiseId(user.id);
    return { success: true, data: await this.franchise.saveProfile(id, dto) };
  }

  /** The partner's shareable card (PNG) — for the dashboard download / share. */
  @Get('marketing-card')
  @Header('Content-Type', 'image/png')
  @Header('Content-Disposition', 'inline; filename="jebdekho-partner-card.png"')
  async marketingCard(@CurrentUser() user: RequestUser): Promise<StreamableFile> {
    const id = await this.franchise.resolveFranchiseId(user.id);
    return new StreamableFile(await this.franchise.getMarketingCardPng(id));
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
