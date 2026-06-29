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
exports.FraudService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let FraudService = class FraudService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async flagSelfReferral(walletId) {
        return this.createReview(walletId, 'SELF_REFERRAL', { reason: 'User attempted self-referral' });
    }
    async flagDuplicateDevice(walletId, fingerprint) {
        return this.createReview(walletId, 'DUPLICATE_DEVICE', { fingerprint });
    }
    async flagSuspiciousCredit(walletId, amount, metadata) {
        if (amount < 500)
            return null;
        return this.createReview(walletId, 'SUSPICIOUS_CREDIT', { amount, ...metadata });
    }
    async createReview(walletId, reviewType, metadata) {
        return this.prisma.walletFraudReview.create({
            data: {
                walletId,
                reviewType,
                status: client_1.WalletFraudReviewStatus.PENDING,
                metadata: metadata,
            },
        });
    }
    async listPendingReviews(limit = 50) {
        return this.prisma.walletFraudReview.findMany({
            where: { status: client_1.WalletFraudReviewStatus.PENDING },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                wallet: {
                    select: {
                        id: true,
                        referralCode: true,
                        balance: true,
                        buyerProfile: { select: { id: true, name: true, userId: true } },
                    },
                },
            },
        });
    }
    async resolveReview(reviewId, adminUserId, approve) {
        return this.prisma.walletFraudReview.update({
            where: { id: reviewId },
            data: {
                status: approve ? client_1.WalletFraudReviewStatus.APPROVED : client_1.WalletFraudReviewStatus.REJECTED,
                reviewedBy: adminUserId,
                reviewedAt: new Date(),
            },
        });
    }
};
exports.FraudService = FraudService;
exports.FraudService = FraudService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FraudService);
//# sourceMappingURL=fraud.service.js.map