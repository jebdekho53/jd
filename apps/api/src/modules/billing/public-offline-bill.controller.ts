import { Controller, Get, Header, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { OfflineBillingService } from './offline-billing.service';

/**
 * Unauthenticated invoice view for a walk-in customer who received a bill link
 * from their merchant (e.g. shared manually over WhatsApp). Gated only by the
 * unguessable shareToken — deliberately not the bill's primary key, so it can't
 * be reached by iterating/guessing ids elsewhere in the app.
 */
@ApiTags(Tags.BUYERS)
@Controller('public/offline-bills')
export class PublicOfflineBillController {
  constructor(private readonly billing: OfflineBillingService) {}

  @Get(':shareToken/pdf')
  @Public()
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Public, token-gated bill/receipt PDF for the customer to view' })
  async pdf(@Param('shareToken') shareToken: string, @Res() res: Response) {
    const { pdf } = await this.billing.getBillPdfByShareToken(shareToken);
    res.setHeader('Content-Disposition', 'inline; filename="bill.pdf"');
    res.send(pdf);
  }
}
