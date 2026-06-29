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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorporatePortalController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const corporate_account_service_1 = require("./corporate-account.service");
const approval_service_1 = require("./approval.service");
const corporate_billing_service_1 = require("./corporate-billing.service");
const corporate_wallet_service_1 = require("./corporate-wallet.service");
const prisma_service_1 = require("../../database/prisma.service");
let CorporatePortalController = class CorporatePortalController {
    constructor(accounts, approval, billing, wallet, prisma) {
        this.accounts = accounts;
        this.approval = approval;
        this.billing = billing;
        this.wallet = wallet;
        this.prisma = prisma;
    }
    async listAccounts(user) {
        return { success: true, data: await this.accounts.getAccountsForUser(user.id) };
    }
    async createRequest(user, body) {
        const corpUser = await this.prisma.corporateUser.findFirst({ where: { userId: user.id } });
        if (!corpUser)
            return { success: false, message: 'Not a corporate user' };
        const data = await this.approval.createPurchaseRequest(corpUser.id, body.amount, body.notes);
        return { success: true, data };
    }
    async invoices(user) {
        const corpUser = await this.prisma.corporateUser.findFirst({ where: { userId: user.id } });
        if (!corpUser)
            return { success: true, data: [] };
        return { success: true, data: await this.billing.listInvoices(corpUser.accountId) };
    }
    async walletBalance(user) {
        const corpUser = await this.prisma.corporateUser.findFirst({ where: { userId: user.id } });
        if (!corpUser)
            return { success: true, data: { balance: 0 } };
        return { success: true, data: { balance: await this.wallet.getBalance(corpUser.accountId) } };
    }
};
exports.CorporatePortalController = CorporatePortalController;
__decorate([
    (0, common_1.Get)('accounts'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CorporatePortalController.prototype, "listAccounts", null);
__decorate([
    (0, common_1.Post)('purchase-requests'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CorporatePortalController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)('invoices'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CorporatePortalController.prototype, "invoices", null);
__decorate([
    (0, common_1.Get)('wallet'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CorporatePortalController.prototype, "walletBalance", null);
exports.CorporatePortalController = CorporatePortalController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.BUYERS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('corporate'),
    __metadata("design:paramtypes", [corporate_account_service_1.CorporateAccountService,
        approval_service_1.ApprovalService,
        corporate_billing_service_1.CorporateBillingService,
        corporate_wallet_service_1.CorporateWalletService,
        prisma_service_1.PrismaService])
], CorporatePortalController);
//# sourceMappingURL=corporate-portal.controller.js.map