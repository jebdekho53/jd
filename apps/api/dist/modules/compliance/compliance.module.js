"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceModule = void 0;
const common_1 = require("@nestjs/common");
const gst_calculator_service_1 = require("./gst-calculator.service");
const gst_pdf_service_1 = require("./gst-pdf.service");
const gst_email_service_1 = require("./gst-email.service");
const compliance_cache_service_1 = require("./compliance-cache.service");
const invoice_engine_service_1 = require("./invoice-engine.service");
const credit_note_service_1 = require("./credit-note.service");
const tds_tcs_service_1 = require("./tds-tcs.service");
const compliance_export_service_1 = require("./compliance-export.service");
const gst_config_service_1 = require("./gst-config.service");
const compliance_service_1 = require("./compliance.service");
const admin_compliance_controller_1 = require("./admin-compliance.controller");
const merchant_gst_controller_1 = require("./merchant-gst.controller");
const buyer_invoice_controller_1 = require("./buyer-invoice.controller");
let ComplianceModule = class ComplianceModule {
};
exports.ComplianceModule = ComplianceModule;
exports.ComplianceModule = ComplianceModule = __decorate([
    (0, common_1.Module)({
        controllers: [admin_compliance_controller_1.AdminComplianceController, merchant_gst_controller_1.MerchantGstController, buyer_invoice_controller_1.BuyerInvoiceController],
        providers: [
            gst_calculator_service_1.GstCalculatorService,
            gst_pdf_service_1.GstPdfService,
            gst_email_service_1.GstEmailService,
            compliance_cache_service_1.ComplianceCacheService,
            invoice_engine_service_1.InvoiceEngineService,
            credit_note_service_1.CreditNoteService,
            tds_tcs_service_1.TdsTcsService,
            compliance_export_service_1.ComplianceExportService,
            gst_config_service_1.GstConfigService,
            compliance_service_1.ComplianceService,
        ],
        exports: [
            invoice_engine_service_1.InvoiceEngineService,
            credit_note_service_1.CreditNoteService,
            compliance_service_1.ComplianceService,
            gst_config_service_1.GstConfigService,
            tds_tcs_service_1.TdsTcsService,
        ],
    })
], ComplianceModule);
//# sourceMappingURL=compliance.module.js.map