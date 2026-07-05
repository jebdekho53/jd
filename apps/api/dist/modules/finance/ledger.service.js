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
var LedgerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const ledger_accounts_constants_1 = require("./ledger-accounts.constants");
let LedgerService = LedgerService_1 = class LedgerService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(LedgerService_1.name);
        this.accountCache = new Map();
    }
    async onModuleInit() {
        await this.seedAccounts();
        await this.refreshAccountCache();
    }
    async seedAccounts() {
        for (const def of ledger_accounts_constants_1.LEDGER_ACCOUNT_DEFINITIONS) {
            await this.prisma.ledgerAccount.upsert({
                where: { code: def.code },
                update: {},
                create: {
                    code: def.code,
                    name: def.name,
                    kind: def.kind,
                    isActive: true,
                },
            });
        }
    }
    async refreshAccountCache() {
        const accounts = await this.prisma.ledgerAccount.findMany({ where: { isActive: true } });
        this.accountCache.clear();
        for (const a of accounts)
            this.accountCache.set(a.code, a.id);
    }
    async postJournal(input) {
        const existing = await this.prisma.ledgerJournal.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
            select: { id: true },
        });
        if (existing)
            return existing.id;
        const totalDebit = round(input.lines.reduce((s, l) => s + l.debit, 0));
        const totalCredit = round(input.lines.reduce((s, l) => s + l.credit, 0));
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new common_1.BadRequestException(`Unbalanced journal: debit=${totalDebit} credit=${totalCredit}`);
        }
        await this.ensureAccounts();
        const journal = await this.prisma.$transaction(async (tx) => {
            const j = await tx.ledgerJournal.create({
                data: {
                    referenceType: input.referenceType,
                    referenceId: input.referenceId,
                    orderId: input.orderId,
                    description: input.description,
                    idempotencyKey: input.idempotencyKey,
                    metadata: input.metadata,
                },
            });
            for (const line of input.lines) {
                const accountId = this.accountCache.get(line.accountCode);
                if (!accountId)
                    throw new common_1.BadRequestException(`Unknown account: ${line.accountCode}`);
                await tx.ledgerEntry.create({
                    data: {
                        journalId: j.id,
                        accountId,
                        debit: line.debit,
                        credit: line.credit,
                    },
                });
            }
            return j;
        });
        return journal.id;
    }
    async recordOrderPayment(orderId, amount, isCod) {
        if (amount <= 0)
            return;
        const debitAccount = isCod
            ? ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.COD_COLLECTED
            : ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.CUSTOMER_RECEIVABLE;
        await this.postJournal({
            referenceType: client_1.LedgerReferenceType.ORDER_PAYMENT,
            referenceId: orderId,
            orderId,
            description: isCod ? 'COD order created' : 'Order payment received',
            idempotencyKey: `order-payment:${orderId}`,
            lines: [
                { accountCode: debitAccount, debit: amount, credit: 0 },
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, debit: 0, credit: amount },
            ],
        });
    }
    async recordMerchantSettlement(orderId, merchantProfileId, gross, commission, net) {
        await this.postJournal({
            referenceType: client_1.LedgerReferenceType.MERCHANT_SETTLEMENT,
            referenceId: orderId,
            orderId,
            description: `Merchant settlement for order ${orderId}`,
            idempotencyKey: `merchant-settlement:${orderId}`,
            lines: [
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, debit: gross, credit: 0 },
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.MERCHANT_PAYABLE, debit: 0, credit: net },
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.PLATFORM_COMMISSION, debit: 0, credit: commission },
            ],
            metadata: { merchantProfileId },
        });
    }
    async recordMerchantPayout(payoutId, merchantProfileId, amount) {
        await this.postJournal({
            referenceType: client_1.LedgerReferenceType.MERCHANT_PAYOUT,
            referenceId: payoutId,
            description: `Merchant payout ${payoutId}`,
            idempotencyKey: `merchant-payout:${payoutId}`,
            lines: [
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.MERCHANT_PAYABLE, debit: amount, credit: 0 },
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.CUSTOMER_RECEIVABLE, debit: 0, credit: amount },
            ],
            metadata: { merchantProfileId },
        });
    }
    async recordRefund(orderId, amount) {
        if (amount <= 0)
            return;
        await this.postJournal({
            referenceType: client_1.LedgerReferenceType.REFUND,
            referenceId: orderId,
            orderId,
            description: `Refund for order ${orderId}`,
            idempotencyKey: `refund:${orderId}`,
            lines: [
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.REFUND_EXPENSE, debit: amount, credit: 0 },
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, debit: 0, credit: amount },
            ],
        });
    }
    async recordClaimRefund(claimId, orderId, amount) {
        if (amount <= 0)
            return;
        await this.postJournal({
            referenceType: client_1.LedgerReferenceType.REFUND,
            referenceId: claimId,
            orderId,
            description: `Claim refund ${claimId}`,
            idempotencyKey: `claim-refund-ledger:${claimId}`,
            lines: [
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.REFUND_EXPENSE, debit: amount, credit: 0 },
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, debit: 0, credit: amount },
            ],
            metadata: { claimId, orderId },
        });
    }
    async recordWalletCredit(walletTxnId, amount) {
        await this.postJournal({
            referenceType: client_1.LedgerReferenceType.WALLET_CREDIT,
            referenceId: walletTxnId,
            description: `Wallet credit ${walletTxnId}`,
            idempotencyKey: `wallet-credit:${walletTxnId}`,
            lines: [
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.PROMOTION_EXPENSE, debit: amount, credit: 0 },
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.WALLET_LIABILITY, debit: 0, credit: amount },
            ],
        });
    }
    async recordRiderPayout(payoutId, riderProfileId, amount) {
        await this.postJournal({
            referenceType: client_1.LedgerReferenceType.RIDER_PAYOUT,
            referenceId: payoutId,
            description: `Rider payout ${payoutId}`,
            idempotencyKey: `rider-payout:${payoutId}`,
            lines: [
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.RIDER_PAYABLE, debit: amount, credit: 0 },
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.CUSTOMER_RECEIVABLE, debit: 0, credit: amount },
            ],
            metadata: { riderProfileId },
        });
    }
    async recordTaxAccrual(orderId, taxAmount, taxableAmount) {
        if (taxAmount <= 0)
            return;
        await this.postJournal({
            referenceType: client_1.LedgerReferenceType.TAX_ACCRUAL,
            referenceId: orderId,
            orderId,
            description: `GST accrual order ${orderId}`,
            idempotencyKey: `tax:${orderId}`,
            lines: [
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, debit: taxAmount, credit: 0 },
                { accountCode: ledger_accounts_constants_1.LEDGER_ACCOUNT_CODES.GST_PAYABLE, debit: 0, credit: taxAmount },
            ],
            metadata: { taxableAmount },
        });
    }
    async getAccountBalances() {
        const accounts = await this.prisma.ledgerAccount.findMany({ where: { isActive: true } });
        const result = [];
        for (const acct of accounts) {
            const agg = await this.prisma.ledgerEntry.aggregate({
                where: { accountId: acct.id },
                _sum: { debit: true, credit: true },
            });
            const debit = Number(agg._sum.debit ?? 0);
            const credit = Number(agg._sum.credit ?? 0);
            const balance = acct.kind === client_1.LedgerAccountKind.ASSET || acct.kind === client_1.LedgerAccountKind.EXPENSE
                ? debit - credit
                : credit - debit;
            result.push({ code: acct.code, name: acct.name, debit, credit, balance });
        }
        return result;
    }
    async ensureAccounts() {
        if (this.accountCache.size > 0)
            return;
        await this.refreshAccountCache();
    }
};
exports.LedgerService = LedgerService;
exports.LedgerService = LedgerService = LedgerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LedgerService);
function round(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=ledger.service.js.map