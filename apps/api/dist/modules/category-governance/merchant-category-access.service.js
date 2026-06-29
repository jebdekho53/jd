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
exports.MerchantCategoryAccessService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let MerchantCategoryAccessService = class MerchantCategoryAccessService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getApprovedCategoryIds(merchantProfileId) {
        const rows = await this.prisma.merchantCategory.findMany({
            where: { merchantProfileId, status: client_1.MerchantCategoryStatus.APPROVED },
            select: { categoryId: true },
        });
        return new Set(rows.map((r) => r.categoryId));
    }
    async assertCategoryApproved(merchantProfileId, categoryId) {
        const approved = await this.prisma.merchantCategory.findFirst({
            where: {
                merchantProfileId,
                categoryId,
                status: client_1.MerchantCategoryStatus.APPROVED,
            },
        });
        if (!approved) {
            throw new common_1.ForbiddenException('You are not authorized to sell in this category. Request category access from Business Categories.');
        }
    }
    async assertProductCategoryAllowed(merchantProfileId, categoryId) {
        const cat = await this.prisma.category.findFirst({
            where: {
                id: categoryId,
                deletedAt: null,
                isActive: true,
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
            },
            select: { id: true, parentId: true, name: true },
        });
        if (!cat) {
            throw new common_1.BadRequestException('Category not found or is not available');
        }
        if (cat.parentId) {
            const parent = await this.prisma.category.findFirst({
                where: {
                    id: cat.parentId,
                    deletedAt: null,
                    isActive: true,
                    storeId: null,
                    scope: client_1.CategoryScope.GLOBAL,
                },
            });
            if (!parent) {
                throw new common_1.BadRequestException('Parent category is not available');
            }
            await this.assertCategoryApproved(merchantProfileId, cat.parentId);
        }
        await this.assertCategoryApproved(merchantProfileId, categoryId);
    }
    async listApprovedCategoryTree(merchantProfileId) {
        const approvedIds = await this.getApprovedCategoryIds(merchantProfileId);
        if (approvedIds.size === 0)
            return [];
        const categories = await this.prisma.category.findMany({
            where: {
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
                isActive: true,
                deletedAt: null,
                OR: [
                    { id: { in: [...approvedIds] } },
                    { children: { some: { id: { in: [...approvedIds] }, deletedAt: null } } },
                ],
            },
            include: {
                children: {
                    where: { isActive: true, deletedAt: null, id: { in: [...approvedIds] } },
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
        return categories
            .filter((c) => c.parentId === null && approvedIds.has(c.id))
            .map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            imageUrl: c.imageUrl,
            parentId: c.parentId,
            sortOrder: c.sortOrder,
            children: c.children.map((ch) => ({
                id: ch.id,
                name: ch.name,
                slug: ch.slug,
                imageUrl: ch.imageUrl,
                parentId: ch.parentId,
                sortOrder: ch.sortOrder,
                children: [],
            })),
        }));
    }
};
exports.MerchantCategoryAccessService = MerchantCategoryAccessService;
exports.MerchantCategoryAccessService = MerchantCategoryAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MerchantCategoryAccessService);
//# sourceMappingURL=merchant-category-access.service.js.map