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
exports.VerificationBlocklistService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const rejection_constants_1 = require("../../common/constants/rejection.constants");
let VerificationBlocklistService = class VerificationBlocklistService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    normalizePhone(phone) {
        const digits = phone.replace(/\D/g, '');
        return digits.slice(-10);
    }
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
    normalizeGst(gst) {
        return gst.trim().toUpperCase();
    }
    normalizePan(pan) {
        return pan.trim().toUpperCase();
    }
    buildEntries(input) {
        const entries = [];
        if (input.phone?.trim()) {
            entries.push({
                type: client_1.MerchantBlocklistType.PHONE,
                value: this.normalizePhone(input.phone),
            });
        }
        if (input.email?.trim()) {
            entries.push({
                type: client_1.MerchantBlocklistType.EMAIL,
                value: this.normalizeEmail(input.email),
            });
        }
        if (input.gstNumber?.trim()) {
            entries.push({
                type: client_1.MerchantBlocklistType.GST_NUMBER,
                value: this.normalizeGst(input.gstNumber),
            });
        }
        if (input.panNumber?.trim()) {
            entries.push({
                type: client_1.MerchantBlocklistType.PAN_NUMBER,
                value: this.normalizePan(input.panNumber),
            });
        }
        return entries;
    }
    async assertMerchantProfileNotBlacklisted(merchantProfileId) {
        const profile = await this.prisma.merchantProfile.findUnique({
            where: { id: merchantProfileId },
            select: { isBlacklisted: true },
        });
        if (profile?.isBlacklisted) {
            throw new common_1.ForbiddenException(rejection_constants_1.MERCHANT_BLOCKED_MESSAGE);
        }
    }
    async assertUserNotBlacklisted(userId) {
        const profile = await this.prisma.merchantProfile.findUnique({
            where: { userId },
            select: { isBlacklisted: true },
        });
        if (profile?.isBlacklisted) {
            throw new common_1.ForbiddenException(rejection_constants_1.MERCHANT_BLOCKED_MESSAGE);
        }
    }
    async assertNotBlocked(input) {
        const entries = this.buildEntries(input);
        if (!entries.length)
            return;
        const blocked = await this.prisma.merchantVerificationBlocklist.findFirst({
            where: {
                OR: entries.map((e) => ({ type: e.type, value: e.value })),
            },
        });
        if (blocked) {
            throw new common_1.ForbiddenException(rejection_constants_1.MERCHANT_BLOCKED_MESSAGE);
        }
    }
    async blockMerchantIdentifiers(input, reason, blockedBy, storeId) {
        const entries = this.buildEntries(input);
        if (!entries.length)
            return;
        await this.prisma.$transaction(entries.map((entry) => this.prisma.merchantVerificationBlocklist.upsert({
            where: {
                type_value: { type: entry.type, value: entry.value },
            },
            update: {
                reason,
                storeId: storeId ?? null,
                blockedBy,
            },
            create: {
                type: entry.type,
                value: entry.value,
                reason,
                storeId: storeId ?? null,
                blockedBy,
            },
        })));
    }
    async removeMerchantIdentifiers(input) {
        const entries = this.buildEntries(input);
        if (!entries.length)
            return;
        await this.prisma.merchantVerificationBlocklist.deleteMany({
            where: {
                OR: entries.map((e) => ({ type: e.type, value: e.value })),
            },
        });
    }
};
exports.VerificationBlocklistService = VerificationBlocklistService;
exports.VerificationBlocklistService = VerificationBlocklistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VerificationBlocklistService);
//# sourceMappingURL=verification-blocklist.service.js.map