"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorporateBillingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const ledger_service_1 = require("../finance/ledger.service");
const ledger_accounts_constants_1 = require("../finance/ledger-accounts.constants");
let CorporateBillingService = class CorporateBillingService {
    constructor(prisma, ledger) {
        this.prisma = prisma;
        this.ledger = ledger;
    }
    async generateMonthlyInvoice(accountId, periodStart, periodEnd) {
        const orders = await this.prisma.purchaseRequest.findMany({
            where: {
                employee: { accountId },
                status: 'APPROVED',
                createdAt: { gte: periodStart, lte: periodEnd },
            },
        });
        const invoiceAmount = orders.reduce((s, o) => s + Number(o.amount), 0);
        if (invoiceAmount <= 0)
            return null;
        const invoiceNumber = `CORP-${accountId.slice(0, 6).toUpperCase()}-${Date.now()}`;
        const journalId = await this.ledger.postJournal({
            referenceType: client_1.LedgerReferenceType.ADJUSTMENT,
            referenceId: accountId,
            description: `Corporate invoice ${invoiceNumber}`,
            idempotencyKey: `corp-inv-${invoiceNumber}`,
            lines: [
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.CUSTOMER_RECEIVABLE, debit: invoiceAmount, credit: 0 },
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, debit: 0, credit: invoiceAmount },
            ],
        });
        return this.prisma.corporateInvoice.create({
            data: {
                accountId,
                invoiceNumber,
                invoiceAmount,
                periodStart,
                periodEnd,
                ledgerJournalId: journalId,
            },
        });
    }
    async listInvoices(accountId) {
        return this.prisma.corporateInvoice.findMany({
            where: { accountId },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.CorporateBillingService = CorporateBillingService;
exports.CorporateBillingService = CorporateBillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService])
], CorporateBillingService);
//# sourceMappingURL=corporate-billing.service.js.map