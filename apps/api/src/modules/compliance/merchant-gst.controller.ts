import {
  Body,
  Controller,
  Get,
  Header,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceService } from './compliance.service';
import { GstConfigService } from './gst-config.service';
import { ComplianceExportService } from './compliance-export.service';
import { InvoiceEngineService } from './invoice-engine.service';
import { EnsureHsnCodeDto, ExportComplianceQueryDto, ListComplianceQueryDto, UpdateProductTaxDto } from './dto/compliance.dto';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
@Controller('merchant/gst')
export class MerchantGstController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly compliance: ComplianceService,
    private readonly config: GstConfigService,
    private readonly exports: ComplianceExportService,
    private readonly invoices: InvoiceEngineService,
  ) {}

  private async merchantProfileId(userId: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return profile?.id ?? null;
  }

  @Get('overview')
  @ApiOperation({ summary: 'Merchant GST dashboard' })
  async overview(@CurrentUser() user: RequestUser, @Query('month') month?: string) {
    const merchantProfileId = await this.merchantProfileId(user.id);
    if (!merchantProfileId) return { success: false, message: 'Merchant profile not found' };
    const data = await this.compliance.merchantGstDashboard(merchantProfileId, month);
    return { success: true, data };
  }

  @Get('invoices')
  async listInvoices(
    @CurrentUser() user: RequestUser,
    @Query() query: ListComplianceQueryDto,
  ) {
    const merchantProfileId = await this.merchantProfileId(user.id);
    if (!merchantProfileId) return { success: false, message: 'Merchant profile not found' };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: { merchantProfileId: string; invoiceDate?: { gte: Date; lt: Date } } = {
      merchantProfileId,
    };
    if (query.month) {
      const [y, m] = query.month.split('-').map(Number);
      where.invoiceDate = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }

    const [items, total] = await Promise.all([
      this.prisma.gSTInvoice.findMany({
        where,
        orderBy: { invoiceDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { order: { select: { orderNumber: true } } },
      }),
      this.prisma.gSTInvoice.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items: items.map((i) => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          orderNumber: i.order.orderNumber,
          grandTotal: Number(i.grandTotal),
          totalTax: Number(i.totalTax),
          invoiceDate: i.invoiceDate,
        })),
        total,
        page,
        limit,
      },
    };
  }

  @Get('invoices/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  async invoicePdf(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() res: Response) {
    const merchantProfileId = await this.merchantProfileId(user.id);
    const invoice = await this.prisma.gSTInvoice.findFirst({
      where: { id, merchantProfileId: merchantProfileId ?? undefined },
    });
    if (!invoice) {
      res.status(404).send('Not found');
      return;
    }
    const pdf = await this.invoices.getInvoicePdf(id);
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(pdf);
  }

  @Get('reports/summary')
  async exportSummary(
    @CurrentUser() user: RequestUser,
    @Query() query: ExportComplianceQueryDto,
    @Res() res: Response,
  ) {
    const merchantProfileId = await this.merchantProfileId(user.id);
    if (!merchantProfileId) {
      res.status(404).send('Not found');
      return;
    }
    const out = await this.exports.merchantGstSummary(
      merchantProfileId,
      query.month,
      query.format,
    );
    res.setHeader('Content-Type', out.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
    res.send(out.binary ? Buffer.from(out.content, 'base64') : out.content);
  }

  @Get('hsn')
  async hsn(@Query('q') q?: string) {
    return { success: true, data: await this.config.listHsnCodes(q) };
  }

  @Post('hsn')
  @ApiOperation({ summary: 'Register (or fetch) an HSN code entered by the merchant' })
  async ensureHsn(@Body() dto: EnsureHsnCodeDto) {
    return { success: true, data: await this.config.ensureHsnCode(dto.code, dto.gstSlab, dto.description) };
  }

  @Patch('products/:productId/tax')
  async updateProductTax(
    @CurrentUser() user: RequestUser,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductTaxDto,
  ) {
    const store = await this.prisma.store.findFirst({
      where: { merchantProfile: { userId: user.id }, isActive: true },
      select: { id: true },
    });
    if (!store) return { success: false, message: 'Store not found' };

    const updated = await this.config.updateProductTax(productId, store.id, dto);
    if (!updated) return { success: false, message: 'Product not found' };
    return { success: true, data: updated };
  }
}
