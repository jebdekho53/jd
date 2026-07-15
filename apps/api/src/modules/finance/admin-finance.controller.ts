import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { FinanceService } from './finance.service';
import { SettlementBatchService } from './settlement-batch.service';
import { CodReconciliationService } from './cod-reconciliation.service';
import { RiderPayoutService } from './rider-payout.service';
import { RiderBankAccountService } from './rider-bank-account.service';
import { FinanceExportService } from './finance-export.service';
import { OrderRefundService } from '../payment/order-refund.service';
import { SettlementService } from '../settlement/settlement.service';
import { FinanceCommissionService } from './finance-commission.service';
import {
  CodSubmitDto,
  ExportQueryDto,
  GenerateSettlementDto,
  ListFinanceQueryDto,
  MarkRiderPayoutPaidDto,
  RejectCodDto,
} from './dto/finance.dto';
import {
  CreateCommissionRuleDto,
  UpdateCommissionRuleDto,
} from './dto/commission-rule.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/finance')
export class AdminFinanceController {
  constructor(
    private readonly finance: FinanceService,
    private readonly batches: SettlementBatchService,
    private readonly cod: CodReconciliationService,
    private readonly riderPayouts: RiderPayoutService,
    private readonly riderBankAccounts: RiderBankAccountService,
    private readonly exports: FinanceExportService,
    private readonly settlement: SettlementService,
    private readonly orderRefunds: OrderRefundService,
    private readonly commission: FinanceCommissionService,
  ) {}

  // ── Commission rules ───────────────────────────────────────────────────────

  @Get('commission-rules')
  @Permissions('settlements:read')
  @ApiOperation({ summary: 'List commission rules + platform default' })
  async listCommissionRules() {
    const data = await this.commission.listRules();
    return { success: true, data };
  }

  @Post('commission-rules')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('settlements:manage')
  @ApiOperation({ summary: 'Create a GLOBAL/STORE/CATEGORY commission rule' })
  async createCommissionRule(@Body() dto: CreateCommissionRuleDto) {
    const data = await this.commission.createRule(dto);
    return { success: true, data };
  }

  @Patch('commission-rules/:id')
  @Permissions('settlements:manage')
  @ApiOperation({ summary: 'Update a commission rule (rate / delay / active)' })
  async updateCommissionRule(@Param('id') id: string, @Body() dto: UpdateCommissionRuleDto) {
    const data = await this.commission.updateRule(id, dto);
    return { success: true, data };
  }

  @Delete('commission-rules/:id')
  @Permissions('settlements:manage')
  @ApiOperation({ summary: 'Delete a commission rule' })
  async deleteCommissionRule(@Param('id') id: string) {
    const data = await this.commission.deleteRule(id);
    return { success: true, data };
  }

  @Get('overview')
  @Permissions('settlements:read')
  @ApiOperation({ summary: 'Finance control tower overview' })
  async overview() {
    const data = await this.finance.getControlTower();
    return { success: true, data };
  }

  @Get('alerts')
  @Permissions('settlements:read')
  async alerts() {
    const data = await this.finance.getAlerts();
    return { success: true, data };
  }

  @Get('revenue')
  @Permissions('settlements:read')
  async revenue() {
    const data = await this.exports.exportRevenueSummary();
    return { success: true, data };
  }

  @Get('settlements')
  @Permissions('settlements:read')
  async settlements(@Query() query: ListFinanceQueryDto) {
    const data = await this.batches.listSettlements(undefined, query.page, query.limit);
    return { success: true, data };
  }

  @Post('settlements/generate')
  @HttpCode(HttpStatus.OK)
  @Permissions('settlements:manage')
  async generateSettlements(@Body() dto: GenerateSettlementDto) {
    const count = await this.batches.generateBatches(dto.cycle, dto.merchantProfileId);
    return { success: true, data: { batchesCreated: count } };
  }

  @Get('cod')
  @Permissions('settlements:read')
  async codList(@Query() query: ListFinanceQueryDto) {
    const data = await this.cod.listAdmin(query.status, query.page, query.limit);
    return { success: true, data };
  }

  @Get('cod/summary')
  @Permissions('settlements:read')
  async codSummary() {
    const data = await this.cod.getSummary();
    return { success: true, data };
  }

  @Post('cod/:id/verify')
  @HttpCode(HttpStatus.OK)
  @Permissions('settlements:manage')
  async verifyCod(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.cod.verify(user.id, id);
    return { success: true, data };
  }

  @Post('cod/:id/reject')
  @HttpCode(HttpStatus.OK)
  @Permissions('settlements:manage')
  async rejectCod(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: RejectCodDto,
  ) {
    const data = await this.cod.reject(user.id, id, dto.reason);
    return { success: true, data };
  }

  @Get('refunds/failed')
  @Permissions('settlements:read')
  @ApiOperation({ summary: 'List failed order refunds for admin dashboard' })
  async failedRefunds(@Query() query: ListFinanceQueryDto) {
    const data = await this.orderRefunds.listFailedRefunds(query.page, query.limit);
    return { success: true, data };
  }

  @Get('merchant-payouts')
  @Permissions('settlements:read')
  async merchantPayouts(@Query() query: ListFinanceQueryDto) {
    const data = await this.settlement.listAdminPayoutRequests(query);
    return { success: true, data };
  }

  @Get('rider-payouts')
  @Permissions('settlements:read')
  async listRiderPayouts(@Query() query: ListFinanceQueryDto) {
    const data = await this.riderPayouts.listAdmin(query.page, query.limit);
    return { success: true, data };
  }

  @Post('rider-payouts/:id/pay')
  @HttpCode(HttpStatus.OK)
  @Permissions('settlements:manage')
  async payRider(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: MarkRiderPayoutPaidDto,
  ) {
    const data = await this.riderPayouts.markPaid(id, user.id, dto.referenceId);
    return { success: true, data };
  }

  /** Pay a rider payout via Razorpay Route (needs a verified rider bank account). */
  @Post('rider-payouts/:id/pay-route')
  @HttpCode(HttpStatus.OK)
  @Permissions('settlements:manage')
  async payRiderViaRoute(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.riderPayouts.processViaRoute(id, user.id);
    return { success: true, data };
  }

  /** The rider's payout account (masked), so an admin can review before verifying. */
  @Get('riders/:riderProfileId/bank-account')
  @Permissions('settlements:read')
  async getRiderBank(@Param('riderProfileId') id: string) {
    const data = await this.riderBankAccounts.get(id);
    return { success: true, data };
  }

  /** Verify a rider's bank account and create their Razorpay linked account. */
  @Post('riders/:riderProfileId/bank-account/verify')
  @HttpCode(HttpStatus.OK)
  @Permissions('settlements:manage')
  async verifyRiderBank(@CurrentUser() user: RequestUser, @Param('riderProfileId') id: string) {
    const data = await this.riderBankAccounts.verify(user.id, id);
    return { success: true, data };
  }

  @Get('taxes')
  @Permissions('settlements:read')
  async taxes(@Query() query: ExportQueryDto) {
    const period = query.periodMonth ?? new Date().toISOString().slice(0, 7);
    const csv = await this.exports.exportTaxReport(period);
    return { success: true, data: { period, csv } };
  }

  @Get('exports/settlements')
  @Permissions('settlements:read')
  @Header('Content-Type', 'text/csv')
  async exportSettlements(@Res() res: Response, @Query() query: ExportQueryDto) {
    const csv = await this.exports.exportSettlementsCsv(query.merchantProfileId);
    res.setHeader('Content-Disposition', 'attachment; filename=settlements.csv');
    res.send(csv);
  }

  @Get('exports/payouts')
  @Permissions('settlements:read')
  @Header('Content-Type', 'text/csv')
  async exportPayouts(@Res() res: Response) {
    const csv = await this.exports.exportMerchantPayoutsCsv();
    res.setHeader('Content-Disposition', 'attachment; filename=merchant-payouts.csv');
    res.send(csv);
  }
}
