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
exports.TerritoryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let TerritoryService = class TerritoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assignTerritory(franchiseId, input, actorId) {
        const territory = await this.prisma.franchiseTerritory.create({
            data: {
                franchiseId,
                city: input.city,
                state: input.state,
                pincodes: input.pincodes,
                exclusivityEnabled: input.exclusivityEnabled ?? false,
                launchDate: input.launchDate,
            },
        });
        const conflicts = await this.detectOverlap(territory.id, franchiseId, input.pincodes, input.exclusivityEnabled ?? false);
        await this.prisma.franchiseAudit.create({
            data: {
                franchiseId,
                action: conflicts.length > 0 ? client_1.FranchiseAuditAction.CONFLICT_DETECTED : client_1.FranchiseAuditAction.TERRITORY_ASSIGNED,
                actorId,
                metadata: { territoryId: territory.id, conflicts: conflicts.length },
            },
        });
        return { territory, conflicts };
    }
    async detectOverlap(territoryId, franchiseId, pincodes, exclusivityEnabled) {
        if (!exclusivityEnabled || pincodes.length === 0)
            return [];
        const others = await this.prisma.franchiseTerritory.findMany({
            where: {
                id: { not: territoryId },
                exclusivityEnabled: true,
                franchise: { status: client_1.FranchisePartnerStatus.ACTIVE },
            },
            include: { franchise: { select: { businessName: true } } },
        });
        const conflicts = [];
        for (const other of others) {
            const overlap = pincodes.filter((p) => other.pincodes.includes(p));
            for (const pincode of overlap) {
                const existing = await this.prisma.territoryConflict.findFirst({
                    where: {
                        pincode,
                        primaryTerritoryId: territoryId,
                        conflictingTerritoryId: other.id,
                        status: 'OPEN',
                    },
                });
                if (existing)
                    continue;
                const conflict = await this.prisma.territoryConflict.create({
                    data: {
                        franchiseId,
                        primaryTerritoryId: territoryId,
                        conflictingTerritoryId: other.id,
                        pincode,
                    },
                });
                conflicts.push(conflict);
            }
        }
        return conflicts;
    }
    async listConflicts() {
        return this.prisma.territoryConflict.findMany({
            where: { status: 'OPEN' },
            include: {
                franchise: { select: { businessName: true } },
                primaryTerritory: true,
                conflictingTerritory: { include: { franchise: { select: { businessName: true } } } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async getTerritoriesForMap() {
        return this.prisma.franchiseTerritory.findMany({
            where: { franchise: { status: client_1.FranchisePartnerStatus.ACTIVE } },
            include: {
                franchise: { select: { id: true, businessName: true } },
            },
            take: 200,
        });
    }
};
exports.TerritoryService = TerritoryService;
exports.TerritoryService = TerritoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TerritoryService);
//# sourceMappingURL=territory.service.js.map