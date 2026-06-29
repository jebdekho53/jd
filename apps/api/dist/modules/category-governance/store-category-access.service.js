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
exports.StoreCategoryAccessService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let StoreCategoryAccessService = class StoreCategoryAccessService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assertMenuSubcategoryApproved(storeId, merchantProfileId, platformSubcategoryId) {
        const subcategory = await this.prisma.category.findFirst({
            where: {
                id: platformSubcategoryId,
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
                catalogKind: client_1.CategoryCatalogKind.MENU,
                isActive: true,
                deletedAt: null,
                parentId: { not: null },
            },
            select: { id: true, parentId: true, slug: true, name: true },
        });
        if (!subcategory?.parentId) {
            throw new common_1.BadRequestException('Menu subcategory not found or is not a MENU catalog category');
        }
        await this.assertSubcategoryApproved(storeId, merchantProfileId, subcategory.parentId, subcategory.id);
        return {
            parentId: subcategory.parentId,
            subcategoryId: subcategory.id,
            slug: subcategory.slug,
            name: subcategory.name,
        };
    }
    async assertProductCategoryAllowed(storeId, merchantProfileId, categoryId) {
        const cat = await this.prisma.category.findFirst({
            where: {
                id: categoryId,
                deletedAt: null,
                isActive: true,
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
                catalogKind: client_1.CategoryCatalogKind.PRODUCT,
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
            await this.assertSubcategoryApproved(storeId, merchantProfileId, cat.parentId, categoryId);
            return;
        }
        await this.assertParentOrLegacyApproved(storeId, merchantProfileId, categoryId);
    }
    async assertSubcategoryApproved(storeId, merchantProfileId, parentCategoryId, subcategoryId) {
        const storeApproval = await this.prisma.storeCategory.findUnique({
            where: {
                storeId_categoryId_subcategoryId: {
                    storeId,
                    categoryId: parentCategoryId,
                    subcategoryId,
                },
            },
        });
        if (storeApproval)
            return;
        const legacy = await this.prisma.merchantCategory.findFirst({
            where: {
                merchantProfileId,
                categoryId: { in: [parentCategoryId, subcategoryId] },
                status: client_1.MerchantCategoryStatus.APPROVED,
            },
        });
        if (legacy)
            return;
        throw new common_1.ForbiddenException('This store is not authorized to sell in this category. Request category access from Business Categories.');
    }
    async assertParentOrLegacyApproved(storeId, merchantProfileId, categoryId) {
        const storeApproval = await this.prisma.storeCategory.findFirst({
            where: { storeId, categoryId },
        });
        if (storeApproval)
            return;
        const legacy = await this.prisma.merchantCategory.findFirst({
            where: {
                merchantProfileId,
                categoryId,
                status: client_1.MerchantCategoryStatus.APPROVED,
            },
        });
        if (legacy)
            return;
        throw new common_1.ForbiddenException('This store is not authorized to sell in this category. Request category access from Business Categories.');
    }
    async listApprovedCategoryTree(storeId, catalogKind = client_1.CategoryCatalogKind.PRODUCT) {
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, deletedAt: null },
            select: { merchantProfileId: true },
        });
        if (!store)
            return [];
        const storeRows = await this.prisma.storeCategory.findMany({
            where: { storeId },
            select: { categoryId: true, subcategoryId: true },
        });
        const approvedSubIds = new Set(storeRows.map((r) => r.subcategoryId));
        const approvedParentIds = new Set(storeRows.map((r) => r.categoryId));
        if (approvedSubIds.size === 0) {
            const legacy = await this.prisma.merchantCategory.findMany({
                where: {
                    merchantProfileId: store.merchantProfileId,
                    status: client_1.MerchantCategoryStatus.APPROVED,
                },
                select: { categoryId: true },
            });
            for (const row of legacy) {
                const cat = await this.prisma.category.findUnique({
                    where: { id: row.categoryId },
                    select: { id: true, parentId: true },
                });
                if (!cat)
                    continue;
                if (cat.parentId) {
                    approvedSubIds.add(cat.id);
                    approvedParentIds.add(cat.parentId);
                }
                else {
                    approvedParentIds.add(cat.id);
                }
            }
        }
        if (approvedSubIds.size === 0 && approvedParentIds.size === 0)
            return [];
        const categories = await this.prisma.category.findMany({
            where: {
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
                catalogKind,
                isActive: true,
                deletedAt: null,
                OR: [
                    { id: { in: [...approvedParentIds] } },
                    { children: { some: { id: { in: [...approvedSubIds] }, deletedAt: null } } },
                ],
            },
            include: {
                children: {
                    where: {
                        isActive: true,
                        deletedAt: null,
                        id: { in: [...approvedSubIds] },
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
        return categories
            .filter((c) => c.parentId === null && (approvedParentIds.has(c.id) || c.children.length > 0))
            .map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            imageUrl: c.imageUrl,
            icon: c.icon,
            parentId: c.parentId,
            sortOrder: c.sortOrder,
            children: c.children.map((ch) => ({
                id: ch.id,
                name: ch.name,
                slug: ch.slug,
                imageUrl: ch.imageUrl,
                icon: ch.icon,
                parentId: ch.parentId,
                sortOrder: ch.sortOrder,
                children: [],
            })),
        }));
    }
};
exports.StoreCategoryAccessService = StoreCategoryAccessService;
exports.StoreCategoryAccessService = StoreCategoryAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StoreCategoryAccessService);
//# sourceMappingURL=store-category-access.service.js.map