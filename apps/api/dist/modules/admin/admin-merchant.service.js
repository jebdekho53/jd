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
var AdminMerchantService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminMerchantService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const verification_blocklist_service_1 = require("../merchant/verification-blocklist.service");
let AdminMerchantService = AdminMerchantService_1 = class AdminMerchantService {
    constructor(prisma, audit, domainEvents, blocklist) {
        this.prisma = prisma;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.blocklist = blocklist;
        this.logger = new common_1.Logger(AdminMerchantService_1.name);
    }
    async removeBlacklist(superAdminUserId, merchantProfileId, dto, ipAddress, userAgent) {
        const profile = await this.prisma.merchantProfile.findUnique({
            where: { id: merchantProfileId },
            include: {
                user: { select: { phone: true, email: true } },
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException(`Merchant profile not found: ${merchantProfileId}`);
        }
        if (!profile.isBlacklisted) {
            throw new common_1.BadRequestException('Merchant is not blacklisted.');
        }
        const now = new Date();
        await this.prisma.merchantProfile.update({
            where: { id: merchantProfileId },
            data: {
                isBlacklisted: false,
                blacklistReason: null,
                blacklistedAt: null,
                blacklistedBy: null,
                blacklistRemovedAt: now,
                blacklistRemovedBy: superAdminUserId,
            },
        });
        await this.blocklist.removeMerchantIdentifiers({
            phone: profile.user.phone,
            email: profile.user.email,
            gstNumber: profile.gstNumber,
            panNumber: profile.panNumber,
        });
        let reopenedStoreId;
        if (dto.reopenStoreId) {
            const store = await this.prisma.store.findFirst({
                where: {
                    id: dto.reopenStoreId,
                    merchantProfileId,
                    deletedAt: null,
                },
            });
            if (!store) {
                throw new common_1.NotFoundException(`Store ${dto.reopenStoreId} not found for this merchant.`);
            }
            await this.prisma.store.update({
                where: { id: dto.reopenStoreId },
                data: {
                    status: client_1.StoreStatus.UNDER_REVIEW,
                    isActive: false,
                    reviewedAt: now,
                    reviewedBy: superAdminUserId,
                },
            });
            reopenedStoreId = dto.reopenStoreId;
        }
        await Promise.all([
            this.audit.log({
                actorId: superAdminUserId,
                action: 'MERCHANT_BLACKLIST_REMOVED',
                resourceType: 'merchant_profile',
                resourceId: merchantProfileId,
                ipAddress,
                userAgent,
                metadata: {
                    reason: dto.reason,
                    reopenedStoreId: reopenedStoreId ?? null,
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.MERCHANT_BLACKLIST_REMOVED, 'merchant_profile', merchantProfileId, {
                reason: dto.reason,
                removedBy: superAdminUserId,
                reopenedStoreId: reopenedStoreId ?? null,
            }, { userId: superAdminUserId, ipAddress: ipAddress ?? null }),
        ]);
        this.logger.log({ superAdminUserId, merchantProfileId }, 'Merchant blacklist removed');
        return { merchantProfileId, isBlacklisted: false, reopenedStoreId };
    }
};
exports.AdminMerchantService = AdminMerchantService;
exports.AdminMerchantService = AdminMerchantService = AdminMerchantService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        verification_blocklist_service_1.VerificationBlocklistService])
], AdminMerchantService);
//# sourceMappingURL=admin-merchant.service.js.map