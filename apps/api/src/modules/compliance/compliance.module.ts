import { Module } from '@nestjs/common';
import { GstCalculatorService } from './gst-calculator.service';
import { GstPdfService } from './gst-pdf.service';
import { GstEmailService } from './gst-email.service';
import { ComplianceCacheService } from './compliance-cache.service';
import { InvoiceEngineService } from './invoice-engine.service';
import { CreditNoteService } from './credit-note.service';
import { TdsTcsService } from './tds-tcs.service';
import { ComplianceExportService } from './compliance-export.service';
import { GstConfigService } from './gst-config.service';
import { ComplianceService } from './compliance.service';
import { AdminComplianceController } from './admin-compliance.controller';
import { MerchantGstController } from './merchant-gst.controller';
import { BuyerInvoiceController } from './buyer-invoice.controller';

@Module({
  controllers: [AdminComplianceController, MerchantGstController, BuyerInvoiceController],
  providers: [
    GstCalculatorService,
    GstPdfService,
    GstEmailService,
    ComplianceCacheService,
    InvoiceEngineService,
    CreditNoteService,
    TdsTcsService,
    ComplianceExportService,
    GstConfigService,
    ComplianceService,
  ],
  exports: [
    InvoiceEngineService,
    CreditNoteService,
    ComplianceService,
    GstConfigService,
    TdsTcsService,
  ],
})
export class ComplianceModule {}
