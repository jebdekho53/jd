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
var CategoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const merchant_service_1 = require("../merchant/merchant.service");
const store_category_access_service_1 = require("../category-governance/store-category-access.service");
let CategoryService = CategoryService_1 = class CategoryService {
    constructor(prisma, merchantService, storeCategoryAccess) {
        this.prisma = prisma;
        this.merchantService = merchantService;
        this.storeCategoryAccess = storeCategoryAccess;
        this.logger = new common_1.Logger(CategoryService_1.name);
    }
    async listCategories(storeId, userId) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        await this.verifyStoreOwnership(profile.id, storeId);
        const approvedTree = await this.storeCategoryAccess.listApprovedCategoryTree(storeId);
        const approvedIds = new Set();
        for (const parent of approvedTree) {
            approvedIds.add(parent.id);
            for (const child of parent.children)
                approvedIds.add(child.id);
        }
        const [globalApproved, storeCategories] = await Promise.all([
            approvedIds.size
                ? this.prisma.category.findMany({
                    where: {
                        id: { in: [...approvedIds] },
                        storeId: null,
                        scope: client_1.CategoryScope.GLOBAL,
                        isActive: true,
                        deletedAt: null,
                    },
                    include: {
                        children: {
                            where: { isActive: true, deletedAt: null, id: { in: [...approvedIds] } },
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                })
                : Promise.resolve([]),
            this.prisma.category.findMany({
                where: { storeId, scope: client_1.CategoryScope.STORE, isActive: true },
                include: {
                    children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
                },
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            }),
        ]);
        return [...globalApproved, ...storeCategories];
    }
    async createCategory(userId, storeId, dto) {
        await this.verifyStoreOwnership((await this.merchantService.requireMerchantProfile(userId)).id, storeId);
        const slug = this.toSlug(dto.name);
        const existing = await this.prisma.category.findFirst({
            where: { storeId, slug },
        });
        if (existing) {
            throw new common_1.ConflictException(`Category with slug "${slug}" already exists in this store`);
        }
        if (dto.parentId) {
            const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
            if (!parent)
                throw new common_1.NotFoundException(`Parent category not found: ${dto.parentId}`);
        }
        const category = await this.prisma.category.create({
            data: {
                storeId,
                name: dto.name,
                slug,
                imageUrl: dto.imageUrl,
                parentId: dto.parentId,
                sortOrder: dto.sortOrder ?? 0,
                scope: client_1.CategoryScope.STORE,
                isActive: true,
            },
        });
        this.logger.debug({ storeId, categoryId: category.id }, 'Category created');
        return category;
    }
    async updateCategory(userId, storeId, categoryId, dto) {
        await this.verifyStoreOwnership((await this.merchantService.requireMerchantProfile(userId)).id, storeId);
        const category = await this.prisma.category.findFirst({
            where: { id: categoryId, storeId, scope: client_1.CategoryScope.STORE },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Store category not found: ${categoryId}`);
        }
        const slug = dto.name && dto.name !== category.name ? this.toSlug(dto.name) : undefined;
        if (slug) {
            const dupe = await this.prisma.category.findFirst({
                where: { storeId, slug, id: { not: categoryId } },
            });
            if (dupe)
                throw new common_1.ConflictException(`Slug "${slug}" already in use`);
        }
        return this.prisma.category.update({
            where: { id: categoryId },
            data: {
                ...(dto.name !== undefined && { name: dto.name, slug: slug ?? category.slug }),
                ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
                ...(dto.parentId !== undefined && { parentId: dto.parentId }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });
    }
    async verifyStoreOwnership(merchantProfileId, storeId) {
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, merchantProfileId, deletedAt: null },
        });
        if (!store)
            throw new common_1.NotFoundException('Store not found or not owned by you');
    }
    toSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            .slice(0, 60);
    }
};
exports.CategoryService = CategoryService;
exports.CategoryService = CategoryService = CategoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        merchant_service_1.MerchantService,
        store_category_access_service_1.StoreCategoryAccessService])
], CategoryService);
//# sourceMappingURL=category.service.js.map