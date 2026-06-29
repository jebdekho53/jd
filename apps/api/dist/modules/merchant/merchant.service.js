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
var MerchantService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const verification_blocklist_service_1 = require("./verification-blocklist.service");
let MerchantService = MerchantService_1 = class MerchantService {
    constructor(prisma, audit, blocklist) {
        this.prisma = prisma;
        this.audit = audit;
        this.blocklist = blocklist;
        this.logger = new common_1.Logger(MerchantService_1.name);
    }
    async createProfile(userId, dto, ipAddress) {
        const existing = await this.prisma.merchantProfile.findUnique({ where: { userId } });
        if (existing) {
            throw new common_1.ConflictException('Merchant profile already exists for this account');
        }
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { phone: true, email: true },
        });
        await this.blocklist.assertNotBlocked({
            phone: user.phone,
            email: user.email,
            gstNumber: dto.gstNumber,
            panNumber: dto.panNumber,
        });
        await this.blocklist.assertUserNotBlacklisted(userId);
        const profile = await this.prisma.$transaction(async (tx) => {
            const created = await tx.merchantProfile.create({
                data: {
                    userId,
                    businessName: dto.businessName,
                    gstNumber: dto.gstNumber,
                    panNumber: dto.panNumber,
                    kycStatus: client_1.KycStatus.PENDING,
                },
            });
            return created;
        });
        await this.audit.log({
            actorId: userId,
            action: 'MERCHANT_PROFILE_CREATED',
            resourceType: 'merchant_profile',
            resourceId: profile.id,
            ipAddress,
            metadata: { businessName: dto.businessName },
        });
        this.logger.log({ userId, profileId: profile.id }, 'Merchant profile created');
        return profile;
    }
    async ensureMerchantRole(userId) {
        const merchantRole = await this.prisma.role.findUniqueOrThrow({
            where: { name: client_1.RoleName.MERCHANT },
        });
        await this.prisma.userRole.upsert({
            where: { userId_roleId: { userId, roleId: merchantRole.id } },
            update: {},
            create: { userId, roleId: merchantRole.id },
        });
    }
    async getProfile(userId) {
        const profile = await this.prisma.merchantProfile.findUnique({
            where: { userId },
            include: {
                _count: { select: { stores: true } },
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Merchant profile not found. Create one with POST /merchant/profile');
        }
        return profile;
    }
    async updateProfile(userId, dto, ipAddress) {
        const profile = await this.prisma.merchantProfile.findUnique({
            where: { userId },
            include: { user: { select: { phone: true, email: true } } },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Merchant profile not found');
        }
        await this.blocklist.assertNotBlocked({
            phone: profile.user.phone,
            email: profile.user.email,
            gstNumber: dto.gstNumber ?? profile.gstNumber,
            panNumber: dto.panNumber ?? profile.panNumber,
        });
        await this.blocklist.assertMerchantProfileNotBlacklisted(profile.id);
        const updated = await this.prisma.merchantProfile.update({
            where: { userId },
            data: {
                ...(dto.businessName !== undefined && { businessName: dto.businessName }),
                ...(dto.gstNumber !== undefined && { gstNumber: dto.gstNumber }),
                ...(dto.panNumber !== undefined && { panNumber: dto.panNumber }),
            },
        });
        await this.audit.log({
            actorId: userId,
            action: 'MERCHANT_PROFILE_UPDATED',
            resourceType: 'merchant_profile',
            resourceId: profile.id,
            ipAddress,
            metadata: { changes: Object.keys(dto) },
        });
        return updated;
    }
    async requireMerchantProfile(userId) {
        if (!userId?.trim()) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        const profile = await this.prisma.merchantProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.ForbiddenException('Merchant profile required. Create one with POST /merchant/profile');
        }
        if (profile.userId !== userId) {
            this.logger.error({ userId, profileUserId: profile.userId, profileId: profile.id }, 'Merchant profile ownership mismatch');
            throw new common_1.ForbiddenException('Merchant profile ownership mismatch');
        }
        return profile;
    }
};
exports.MerchantService = MerchantService;
exports.MerchantService = MerchantService = MerchantService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        verification_blocklist_service_1.VerificationBlocklistService])
], MerchantService);
//# sourceMappingURL=merchant.service.js.map