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
exports.VerticalService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let VerticalService = class VerticalService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async listStoreBusinessTypes(storeId) {
        return this.prisma.storeBusinessType.findMany({
            where: { storeId },
            orderBy: [{ isPrimary: 'desc' }, { businessType: 'asc' }],
        });
    }
    async setStoreBusinessTypes(storeId, types, primary) {
        if (types.length === 0) {
            throw new common_1.BadRequestException('At least one business type is required');
        }
        const primaryType = primary ?? types[0];
        if (!types.includes(primaryType)) {
            throw new common_1.BadRequestException('Primary business type must be in the selected types');
        }
        await this.prisma.$transaction(async (tx) => {
            const existing = await tx.storeBusinessType.findMany({ where: { storeId } });
            const existingMap = new Map(existing.map((e) => [e.businessType, e]));
            for (const type of types) {
                const prev = existingMap.get(type);
                if (prev) {
                    await tx.storeBusinessType.update({
                        where: { id: prev.id },
                        data: { isPrimary: type === primaryType },
                    });
                }
                else {
                    await tx.storeBusinessType.create({
                        data: {
                            storeId,
                            businessType: type,
                            status: client_1.StoreBusinessTypeStatus.PENDING,
                            isPrimary: type === primaryType,
                        },
                    });
                }
            }
            const toRemove = existing.filter((e) => !types.includes(e.businessType));
            for (const row of toRemove) {
                await tx.storeBusinessType.delete({ where: { id: row.id } });
            }
        });
        return this.listStoreBusinessTypes(storeId);
    }
    async approveStoreBusinessType(storeId, businessType, adminId) {
        const row = await this.prisma.storeBusinessType.findUnique({
            where: { storeId_businessType: { storeId, businessType } },
        });
        if (!row)
            throw new common_1.NotFoundException('Store business type not found');
        const updated = await this.prisma.storeBusinessType.update({
            where: { id: row.id },
            data: {
                status: client_1.StoreBusinessTypeStatus.APPROVED,
                reviewedBy: adminId,
                reviewedAt: new Date(),
                rejectionReason: null,
            },
        });
        await this.audit.log({
            actorId: adminId,
            action: 'STORE_BUSINESS_TYPE_APPROVED',
            resourceType: 'StoreBusinessType',
            resourceId: row.id,
            metadata: { storeId, businessType },
        });
        return updated;
    }
    async rejectStoreBusinessType(storeId, businessType, adminId, reason) {
        const row = await this.prisma.storeBusinessType.findUnique({
            where: { storeId_businessType: { storeId, businessType } },
        });
        if (!row)
            throw new common_1.NotFoundException('Store business type not found');
        return this.prisma.storeBusinessType.update({
            where: { id: row.id },
            data: {
                status: client_1.StoreBusinessTypeStatus.REJECTED,
                reviewedBy: adminId,
                reviewedAt: new Date(),
                rejectionReason: reason,
            },
        });
    }
    async syncApplicationBusinessTypes(applicationId, types) {
        if (types.length === 0)
            return [];
        await this.prisma.$transaction(async (tx) => {
            const existing = await tx.merchantApplicationBusinessType.findMany({
                where: { applicationId },
            });
            const existingSet = new Set(existing.map((e) => e.businessType));
            for (const type of types) {
                if (!existingSet.has(type)) {
                    await tx.merchantApplicationBusinessType.create({
                        data: { applicationId, businessType: type },
                    });
                }
            }
        });
        return this.prisma.merchantApplicationBusinessType.findMany({
            where: { applicationId },
        });
    }
    async copyApprovedTypesToStore(storeId, applicationId) {
        const appTypes = await this.prisma.merchantApplicationBusinessType.findMany({
            where: { applicationId, status: client_1.StoreBusinessTypeStatus.APPROVED },
        });
        if (appTypes.length === 0)
            return [];
        return this.setStoreBusinessTypes(storeId, appTypes.map((t) => t.businessType), appTypes[0]?.businessType);
    }
    async ensureStoreBusinessTypesFromApplication(storeId) {
        const existing = await this.prisma.storeBusinessType.count({ where: { storeId } });
        if (existing > 0)
            return this.listStoreBusinessTypes(storeId);
        const app = await this.prisma.merchantApplication.findFirst({
            where: { storeId },
            include: { businessTypes: true },
        });
        if (!app)
            return [];
        const types = new Set();
        for (const row of app.businessTypes) {
            types.add(row.businessType);
        }
        if (app.businessType) {
            const mapped = merchantBusinessTypeToVertical(app.businessType);
            if (mapped)
                types.add(mapped);
        }
        const list = [...types];
        if (list.length === 0)
            return [];
        return this.setStoreBusinessTypes(storeId, list, list[0]);
    }
    async findStoresByVertical(businessType, opts = {}) {
        const limit = opts.limit ?? 20;
        const page = opts.page ?? 1;
        const stores = await this.prisma.store.findMany({
            where: {
                status: client_1.StoreStatus.APPROVED,
                isActive: true,
                deletedAt: null,
                businessTypes: {
                    some: { businessType, status: client_1.StoreBusinessTypeStatus.APPROVED },
                },
            },
            include: {
                businessTypes: { where: { status: client_1.StoreBusinessTypeStatus.APPROVED } },
                restaurantProfile: { include: { cuisines: { include: { cuisine: true } } } },
            },
            take: limit,
            skip: (page - 1) * limit,
            orderBy: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }],
        });
        return stores;
    }
};
exports.VerticalService = VerticalService;
exports.VerticalService = VerticalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], VerticalService);
function merchantBusinessTypeToVertical(type) {
    const map = {
        GROCERY: client_1.VerticalBusinessType.GROCERY,
        RESTAURANT: client_1.VerticalBusinessType.RESTAURANT,
        CLOUD_KITCHEN: client_1.VerticalBusinessType.CLOUD_KITCHEN,
        CAFE: client_1.VerticalBusinessType.CAFE,
        BAKERY: client_1.VerticalBusinessType.BAKERY,
        SWEETS: client_1.VerticalBusinessType.SWEETS,
        FRUITS_VEGETABLES: client_1.VerticalBusinessType.FRUITS_VEGETABLES,
        MEAT_FISH: client_1.VerticalBusinessType.MEAT_FISH,
        BEAUTY: client_1.VerticalBusinessType.BEAUTY,
        PET_STORE: client_1.VerticalBusinessType.PET_STORE,
        HOME_KITCHEN: client_1.VerticalBusinessType.HOME_KITCHEN,
        ELECTRONICS: client_1.VerticalBusinessType.ELECTRONICS,
        BABY_STORE: client_1.VerticalBusinessType.BABY_STORE,
        SUPPLEMENTS: client_1.VerticalBusinessType.SUPPLEMENTS,
        HEALTH_NUTRITION: client_1.VerticalBusinessType.SUPPLEMENTS,
        FLOWERS: client_1.VerticalBusinessType.FLOWERS,
        LOCAL_STORE: client_1.VerticalBusinessType.LOCAL_STORE,
        OTHER: client_1.VerticalBusinessType.LOCAL_STORE,
    };
    return map[type] ?? null;
}
//# sourceMappingURL=vertical.service.js.map