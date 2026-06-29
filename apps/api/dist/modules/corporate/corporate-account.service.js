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
exports.CorporateAccountService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let CorporateAccountService = class CorporateAccountService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAccountsForUser(userId) {
        const links = await this.prisma.corporateUser.findMany({
            where: { userId },
            include: { account: { include: { wallet: true, costCenters: true } } },
        });
        return links.map((l) => ({ ...l.account, role: l.role, corporateUserId: l.id }));
    }
    async createAccount(companyName, gstin, creditLimit = 0) {
        return this.prisma.corporateAccount.create({
            data: {
                companyName,
                gstin,
                creditLimit,
                status: client_1.CorporateAccountStatus.PENDING,
                wallet: { create: { balance: 0 } },
            },
            include: { wallet: true },
        });
    }
    async addUser(accountId, userId, role) {
        return this.prisma.corporateUser.create({
            data: { accountId, userId, role },
        });
    }
};
exports.CorporateAccountService = CorporateAccountService;
exports.CorporateAccountService = CorporateAccountService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CorporateAccountService);
//# sourceMappingURL=corporate-account.service.js.map