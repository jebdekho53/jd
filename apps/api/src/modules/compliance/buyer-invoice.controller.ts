import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
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
import { InvoiceEngineService } from './invoice-engine.service';
import { GstEmailService } from './gst-email.service';

@ApiTags(Tags.BUYERS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@Controller('buyer/orders')
export class BuyerInvoiceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly compliance: ComplianceService,
    private readonly invoices: InvoiceEngineService,
    private readonly email: GstEmailService,
  ) {}

  private async buyerProfileId(userId: string) {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return profile?.id ?? null;
  }

  @Get(':orderId/invoice')
  @ApiOperation({ summary: 'View GST invoice for order' })
  async getInvoice(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    const buyerProfileId = await this.buyerProfileId(user.id);
    if (!buyerProfileId) return { success: false, message: 'Buyer profile not found' };

    const data = await this.compliance.buyerInvoiceForOrder(orderId, buyerProfileId);
    if (!data) return { success: true, data: null };
    return { success: true, data };
  }

  @Get(':orderId/invoice/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ) {
    const buyerProfileId = await this.buyerProfileId(user.id);
    const invoice = await this.prisma.gSTInvoice.findFirst({
      where: { orderId, buyerProfileId: buyerProfileId ?? undefined },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const pdf = await this.invoices.getInvoicePdf(invoice.id);
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(pdf);
  }

  @Post(':orderId/invoice/email')
  async emailInvoice(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    const buyerProfileId = await this.buyerProfileId(user.id);
    const invoice = await this.prisma.gSTInvoice.findFirst({
      where: { orderId, buyerProfileId: buyerProfileId ?? undefined },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    await this.email.sendInvoiceEmail(invoice.id);
    return { success: true, message: 'Invoice email sent' };
  }
}
