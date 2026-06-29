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
exports.CorporateAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let CorporateAnalyticsService = class CorporateAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAdminAnalytics() {
        const [accounts, invoices, wallets] = await Promise.all([
            this.prisma.corporateAccount.findMany({ where: { status: 'ACTIVE' } }),
            this.prisma.corporateInvoice.aggregate({ _sum: { invoiceAmount: true } }),
            this.prisma.corporateWallet.findMany(),
        ]);
        const totalSpend = Number(invoices._sum.invoiceAmount ?? 0);
        const creditLimit = accounts.reduce((s, a) => s + Number(a.creditLimit), 0);
        const utilized = wallets.reduce((s, w) => s + Number(w.balance), 0);
        return {
            activeCompanies: accounts.length,
            totalSpend,
            creditLimit,
            creditUtilization: creditLimit > 0 ? Math.round((utilized / creditLimit) * 100) : 0,
            invoices: await this.prisma.corporateInvoice.count(),
        };
    }
    async getAccountSpend(accountId) {
        const requests = await this.prisma.purchaseRequest.findMany({
            where: { employee: { accountId }, status: 'APPROVED' },
        });
        return {
            totalSpend: requests.reduce((s, r) => s + Number(r.amount), 0),
            orderCount: requests.length,
        };
    }
};
exports.CorporateAnalyticsService = CorporateAnalyticsService;
exports.CorporateAnalyticsService = CorporateAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CorporateAnalyticsService);
//# sourceMappingURL=corporate-analytics.service.js.map