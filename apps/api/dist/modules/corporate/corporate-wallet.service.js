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
exports.CorporateWalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let CorporateWalletService = class CorporateWalletService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBalance(accountId) {
        const wallet = await this.prisma.corporateWallet.findUnique({ where: { accountId } });
        return Number(wallet?.balance ?? 0);
    }
    async debit(accountId, amount) {
        const wallet = await this.prisma.corporateWallet.findUnique({
            where: { accountId },
            include: { account: true },
        });
        if (!wallet)
            throw new common_1.BadRequestException('Corporate wallet not found');
        const balance = Number(wallet.balance);
        const creditAvailable = Number(wallet.account.creditLimit) - balance;
        if (amount > balance + creditAvailable) {
            throw new common_1.BadRequestException('Insufficient corporate wallet balance');
        }
        return this.prisma.corporateWallet.update({
            where: { accountId },
            data: { balance: { decrement: amount } },
        });
    }
    async credit(accountId, amount) {
        return this.prisma.corporateWallet.update({
            where: { accountId },
            data: { balance: { increment: amount } },
        });
    }
};
exports.CorporateWalletService = CorporateWalletService;
exports.CorporateWalletService = CorporateWalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CorporateWalletService);
//# sourceMappingURL=corporate-wallet.service.js.map