import {
  Body,
  Controller,
  Get,
  Header,
  Param,
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
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { ComplianceService } from './compliance.service';
import { GstConfigService } from './gst-config.service';
import { ComplianceExportService } from './compliance-export.service';
import { TdsTcsService } from './tds-tcs.service';
import { InvoiceEngineService } from './invoice-engine.service';
import { CreditNoteService } from './credit-note.service';
import { PrismaService } from '../../database/prisma.service';
import { ExportComplianceQueryDto, ListComplianceQueryDto, SyncTdsTcsDto } from './dto/compliance.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/compliance')
export class AdminComplianceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly compliance: ComplianceService,
    private readonly config: GstConfigService,
    private readonly exports: ComplianceExportService,
    private readonly tdsTcs: TdsTcsService,
    private readonly invoices: InvoiceEngineService,
    private readonly creditNotes: CreditNoteService,
  ) {}

  @Get('overview')
  @Permissions('settlements:read')
  @ApiOperation({ summary: 'Compliance center overview' })
  async overview() {
    return { success: true, data: await this.compliance.getOverview() };
  }

  @Get('gst/rates')
  @Permissions('settlements:read')
  async taxRates() {
    return { success: true, data: await this.config.listTaxRates() };
  }

  @Get('gst/jurisdictions')
  @Permissions('settlements:read')
  async jurisdictions() {
    return { success: true, data: await this.config.listJurisdictions() };
  }

  @Get('gst/hsn')
  @Permissions('settlements:read')
  async hsn(@Query('q') q?: string) {
    return { success: true, data: await this.config.listHsnCodes(q) };
  }

  @Get('invoices')
  @Permissions('settlements:read')
  async listInvoices(@Query() query: ListComplianceQueryDto) {
    return { success: true, data: await this.compliance.listInvoices(query.page, query.limit, query.month) };
  }

  @Get('invoices/:id')
  @Permissions('settlements:read')
  async invoiceDetail(@Param('id') id: string) {
    return { success: true, data: await this.compliance.getInvoiceDetail(id) };
  }

  @Get('invoices/:id/pdf')
  @Permissions('settlements:read')
  @Header('Content-Type', 'application/pdf')
  async invoicePdf(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.invoices.getInvoicePdf(id);
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    res.send(pdf);
  }

  @Get('credit-notes')
  @Permissions('settlements:read')
  async listCreditNotes(@Query() query: ListComplianceQueryDto) {
    return { success: true, data: await this.compliance.listCreditNotes(query.page, query.limit) };
  }

  @Get('credit-notes/:id/pdf')
  @Permissions('settlements:read')
  @Header('Content-Type', 'application/pdf')
  async creditNotePdf(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.creditNotes.getCreditNotePdf(id);
    res.send(pdf);
  }

  @Get('debit-notes')
  @Permissions('settlements:read')
  async listDebitNotes(@Query() query: ListComplianceQueryDto) {
    return { success: true, data: await this.compliance.listDebitNotes(query.page, query.limit) };
  }

  @Get('tds')
  @Permissions('settlements:read')
  async tds(@Query('month') month?: string) {
    const records = await this.prisma.tdsRecord.findMany({
      where: month ? { periodMonth: month } : undefined,
      orderBy: { periodMonth: 'desc' },
      take: 50,
      include: { merchantProfile: { select: { businessName: true } } },
    });
    return {
      success: true,
      data: records.map((r) => ({
        id: r.id,
        merchant: r.merchantProfile.businessName,
        periodMonth: r.periodMonth,
        taxableAmount: Number(r.taxableAmount),
        tdsRate: Number(r.tdsRate),
        tdsAmount: Number(r.tdsAmount),
      })),
    };
  }

  @Get('tcs')
  @Permissions('settlements:read')
  async tcs(@Query('month') month?: string) {
    return { success: true, data: await this.tdsTcs.platformTcsSummary(month) };
  }

  @Post('tds-tcs/sync')
  @Permissions('settlements:manage')
  async syncTdsTcs(@Body() dto: SyncTdsTcsDto) {
    const data = await this.tdsTcs.syncMonthlyFromInvoices(dto.periodMonth);
    return { success: true, data };
  }

  @Get('reports/monthly-gst')
  @Permissions('settlements:read')
  async monthlyGst(@Query() query: ExportComplianceQueryDto, @Res() res: Response) {
    const month = query.month ?? new Date().toISOString().slice(0, 7);
    const out = await this.exports.monthlyGstSummary(month, query.format);
    return this.sendExport(res, out);
  }

  @Get('reports/invoice-register')
  @Permissions('settlements:read')
  async invoiceRegister(@Query() query: ExportComplianceQueryDto, @Res() res: Response) {
    const out = await this.exports.invoiceRegister(query.month, query.format);
    return this.sendExport(res, out);
  }

  @Get('reports/credit-note-register')
  @Permissions('settlements:read')
  async creditRegister(@Query() query: ExportComplianceQueryDto, @Res() res: Response) {
    const out = await this.exports.creditNoteRegister(query.month, query.format);
    return this.sendExport(res, out);
  }

  @Get('reports/tax-liability')
  @Permissions('settlements:read')
  async taxLiability(@Query() query: ExportComplianceQueryDto, @Res() res: Response) {
    const month = query.month ?? new Date().toISOString().slice(0, 7);
    const out = await this.exports.taxLiabilityReport(month, query.format);
    return this.sendExport(res, out);
  }

  private sendExport(
    res: Response,
    out: { content: string; mime: string; filename: string; binary?: boolean },
  ) {
    res.setHeader('Content-Type', out.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
    if (out.binary) {
      res.send(Buffer.from(out.content, 'base64'));
    } else {
      res.send(out.content);
    }
  }
}
