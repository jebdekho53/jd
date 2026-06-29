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
exports.FranchiseService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let FranchiseService = class FranchiseService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resolveFranchiseId(userId) {
        const fp = await this.prisma.franchisePartner.findUnique({ where: { userId } });
        if (!fp)
            throw new common_1.ForbiddenException('Franchise partner profile required');
        return fp.id;
    }
    async listFranchises(status) {
        return this.prisma.franchisePartner.findMany({
            where: status ? { status } : undefined,
            include: {
                city: { select: { name: true } },
                _count: { select: { stores: true, territories: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async createFranchise(input) {
        const existing = await this.prisma.franchisePartner.findUnique({ where: { userId: input.userId } });
        if (existing)
            throw new common_1.BadRequestException('User already has franchise profile');
        const fp = await this.prisma.franchisePartner.create({
            data: {
                userId: input.userId,
                businessName: input.businessName,
                gstin: input.gstin,
                pan: input.pan,
                cityId: input.cityId,
                commissionPercent: input.commissionPercent ?? 5,
                status: client_1.FranchisePartnerStatus.PENDING,
            },
        });
        await this.prisma.franchiseAudit.create({
            data: { franchiseId: fp.id, action: client_1.FranchiseAuditAction.ONBOARDED },
        });
        return fp;
    }
    async updateFranchise(id, input, actorId) {
        const fp = await this.prisma.franchisePartner.findUnique({ where: { id } });
        if (!fp)
            throw new common_1.NotFoundException('Franchise not found');
        const updated = await this.prisma.franchisePartner.update({
            where: { id },
            data: input,
        });
        let action = client_1.FranchiseAuditAction.APPROVED;
        if (input.status === client_1.FranchisePartnerStatus.SUSPENDED)
            action = client_1.FranchiseAuditAction.SUSPENDED;
        if (input.status === client_1.FranchisePartnerStatus.TERMINATED)
            action = client_1.FranchiseAuditAction.TERMINATED;
        await this.prisma.franchiseAudit.create({
            data: { franchiseId: id, action, actorId, metadata: input },
        });
        return updated;
    }
    async linkStore(franchiseId, storeId) {
        return this.prisma.franchiseStore.upsert({
            where: { franchiseId_storeId: { franchiseId, storeId } },
            create: { franchiseId, storeId },
            update: {},
            include: { store: { select: { name: true, pincode: true } } },
        });
    }
    async getOverview() {
        const [active, pending, suspended, conflicts] = await Promise.all([
            this.prisma.franchisePartner.count({ where: { status: client_1.FranchisePartnerStatus.ACTIVE } }),
            this.prisma.franchisePartner.count({ where: { status: client_1.FranchisePartnerStatus.PENDING } }),
            this.prisma.franchisePartner.count({ where: { status: client_1.FranchisePartnerStatus.SUSPENDED } }),
            this.prisma.territoryConflict.count({ where: { status: 'OPEN' } }),
        ]);
        return { active, pending, suspended, openConflicts: conflicts };
    }
};
exports.FranchiseService = FranchiseService;
exports.FranchiseService = FranchiseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FranchiseService);
//# sourceMappingURL=franchise.service.js.map