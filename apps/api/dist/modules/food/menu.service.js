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
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const store_category_access_service_1 = require("../category-governance/store-category-access.service");
const vertical_service_1 = require("../store-vertical/vertical.service");
const buyer_cache_service_1 = require("../buyer/buyer-cache.service");
const vertical_constants_1 = require("./vertical.constants");
const menu_category_slug_util_1 = require("./utils/menu-category-slug.util");
const store_fssai_util_1 = require("../../common/utils/store-fssai.util");
let MenuService = class MenuService {
    constructor(prisma, categoryAccess, verticalService, buyerCache) {
        this.prisma = prisma;
        this.categoryAccess = categoryAccess;
        this.verticalService = verticalService;
        this.buyerCache = buyerCache;
    }
    async assertStoreOwnership(merchantProfileId, storeId) {
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, merchantProfileId, deletedAt: null },
        });
        if (!store)
            throw new common_1.NotFoundException('Store not found');
        return store;
    }
    async assertFoodBusinessTypeApproved(storeId) {
        await this.verticalService.ensureStoreBusinessTypesFromApplication(storeId);
        const foodTypes = await this.prisma.storeBusinessType.findMany({
            where: { storeId },
            select: { businessType: true, status: true },
        });
        if (foodTypes.some((row) => (0, vertical_constants_1.isFoodVertical)(row.businessType) && row.status === client_1.StoreBusinessTypeStatus.APPROVED)) {
            return;
        }
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, deletedAt: null },
            select: { status: true },
        });
        if (store?.status === client_1.StoreStatus.APPROVED &&
            foodTypes.some((row) => (0, vertical_constants_1.isFoodVertical)(row.businessType) && row.status === client_1.StoreBusinessTypeStatus.PENDING)) {
            return;
        }
        throw new common_1.ForbiddenException('Restaurant business type must be approved before managing menu categories');
    }
    async invalidateBuyerMenuCache(storeId) {
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, deletedAt: null },
            select: { slug: true },
        });
        if (!store?.slug)
            return;
        await this.buyerCache.invalidateStoreCache(store.slug);
    }
    async assertStoreFssai(storeId) {
        const hasFssai = await (0, store_fssai_util_1.storeHasFssaiOnFile)(this.prisma, storeId);
        if (!hasFssai) {
            throw new common_1.BadRequestException('FSSAI license is required before adding menu items. Upload your FSSAI certificate in Store settings or add the license number on a product.');
        }
    }
    async getBuyerMenu(storeSlug) {
        const store = await this.prisma.store.findFirst({
            where: { slug: storeSlug, isActive: true, deletedAt: null },
            include: {
                restaurantProfile: { include: { cuisines: { include: { cuisine: true } } } },
                businessTypes: { where: { status: 'APPROVED' } },
            },
        });
        if (!store)
            throw new common_1.NotFoundException('Restaurant not found');
        const categories = await this.prisma.restaurantMenuCategory.findMany({
            where: { storeId: store.id, isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
                items: {
                    where: { isActive: true, availability: { not: client_1.MenuItemAvailability.HIDDEN } },
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        variants: { orderBy: { sortOrder: 'asc' } },
                        addonGroups: {
                            orderBy: { sortOrder: 'asc' },
                            include: {
                                group: {
                                    include: {
                                        addons: {
                                            where: { isActive: true },
                                            orderBy: { sortOrder: 'asc' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        const combos = await this.prisma.restaurantCombo.findMany({
            where: { storeId: store.id, isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
                items: {
                    include: { menuItem: { select: { id: true, name: true, imageUrls: true, dietType: true } } },
                },
            },
        });
        return { store, categories, combos };
    }
    async listCategories(merchantProfileId, storeId) {
        await this.assertStoreOwnership(merchantProfileId, storeId);
        return this.prisma.restaurantMenuCategory.findMany({
            where: { storeId },
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: { select: { items: true } },
                platformCategory: { select: { id: true, name: true, slug: true, catalogKind: true } },
            },
        });
    }
    async getMerchantMenu(merchantProfileId, storeId) {
        await this.assertStoreOwnership(merchantProfileId, storeId);
        const [categories, addonGroups, combos] = await Promise.all([
            this.prisma.restaurantMenuCategory.findMany({
                where: { storeId },
                orderBy: { sortOrder: 'asc' },
                include: {
                    platformCategory: { select: { id: true, name: true, slug: true } },
                    items: {
                        orderBy: { sortOrder: 'asc' },
                        include: {
                            variants: { orderBy: { sortOrder: 'asc' } },
                            addonGroups: {
                                orderBy: { sortOrder: 'asc' },
                                include: { group: { include: { addons: { orderBy: { sortOrder: 'asc' } } } } },
                            },
                        },
                    },
                },
            }),
            this.prisma.restaurantAddonGroup.findMany({
                where: { storeId },
                orderBy: { sortOrder: 'asc' },
                include: { addons: { orderBy: { sortOrder: 'asc' } } },
            }),
            this.prisma.restaurantCombo.findMany({
                where: { storeId },
                orderBy: { sortOrder: 'asc' },
                include: {
                    items: {
                        include: { menuItem: { select: { id: true, name: true } } },
                    },
                },
            }),
        ]);
        return { categories, addonGroups, combos };
    }
    async createCategory(merchantProfileId, storeId, dto) {
        await this.assertStoreOwnership(merchantProfileId, storeId);
        await this.assertFoodBusinessTypeApproved(storeId);
        if (!dto.platformCategoryId?.trim()) {
            throw new common_1.BadRequestException('platformCategoryId is required — select an approved menu subcategory');
        }
        const platform = await this.categoryAccess.assertMenuSubcategoryApproved(storeId, merchantProfileId, dto.platformCategoryId);
        const existing = await this.prisma.restaurantMenuCategory.findFirst({
            where: { storeId, platformCategoryId: dto.platformCategoryId, isActive: true },
        });
        if (existing) {
            throw new common_1.ConflictException('A menu category for this approved subcategory already exists');
        }
        const displayName = dto.name?.trim() || platform.name;
        const slug = dto.slug ?? (0, vertical_constants_1.slugifyMenu)(displayName);
        const categorySlug = dto.categorySlug ?? (0, menu_category_slug_util_1.mapPlatformSlugToMenuCategorySlug)(platform.slug);
        const category = await this.prisma.restaurantMenuCategory.create({
            data: {
                storeId,
                platformCategoryId: platform.subcategoryId,
                name: displayName,
                slug,
                categorySlug,
                description: dto.description,
                imageUrl: dto.imageUrl,
                sortOrder: dto.sortOrder ?? 0,
            },
            include: {
                platformCategory: { select: { id: true, name: true, slug: true } },
            },
        });
        void this.invalidateBuyerMenuCache(storeId);
        return category;
    }
    async createMenuItem(merchantProfileId, storeId, dto) {
        await this.assertStoreOwnership(merchantProfileId, storeId);
        await this.assertFoodBusinessTypeApproved(storeId);
        await this.assertStoreFssai(storeId);
        const category = await this.prisma.restaurantMenuCategory.findFirst({
            where: { id: dto.categoryId, storeId },
        });
        if (!category)
            throw new common_1.NotFoundException('Menu category not found');
        if (category.platformCategoryId) {
            await this.categoryAccess.assertMenuSubcategoryApproved(storeId, merchantProfileId, category.platformCategoryId);
        }
        const slug = dto.slug ?? (0, vertical_constants_1.slugifyMenu)(dto.name);
        const item = await this.prisma.restaurantMenuItem.create({
            data: {
                storeId,
                categoryId: dto.categoryId,
                name: dto.name,
                slug,
                description: dto.description,
                imageUrls: (dto.imageUrls ?? []),
                basePrice: dto.basePrice,
                mrp: dto.mrp,
                dietType: dto.dietType ?? client_1.DietType.VEG,
                spiceLevel: dto.spiceLevel,
                prepTimeMins: dto.prepTimeMins ?? 15,
                servingSize: dto.servingSize,
                cuisineName: dto.cuisineName,
                allowsSpecialInstructions: dto.allowsSpecialInstructions ?? true,
                sortOrder: dto.sortOrder ?? 0,
                variants: dto.variants?.length
                    ? {
                        create: dto.variants.map((v, i) => ({
                            name: v.name,
                            price: v.price,
                            isDefault: v.isDefault ?? i === 0,
                            sortOrder: i,
                        })),
                    }
                    : undefined,
            },
            include: { variants: true },
        });
        await this.upsertSearchIndex(item.id);
        void this.invalidateBuyerMenuCache(storeId);
        return item;
    }
    async createAddonGroup(merchantProfileId, storeId, dto) {
        await this.assertStoreOwnership(merchantProfileId, storeId);
        return this.prisma.restaurantAddonGroup.create({
            data: {
                storeId,
                name: dto.name,
                selectionType: dto.selectionType ?? 'SINGLE',
                isRequired: dto.isRequired ?? false,
                minSelections: dto.minSelections ?? 0,
                maxSelections: dto.maxSelections ?? 1,
                sortOrder: dto.sortOrder ?? 0,
                addons: dto.addons?.length
                    ? {
                        create: dto.addons.map((a, i) => ({
                            name: a.name,
                            price: a.price ?? 0,
                            dietType: a.dietType,
                            sortOrder: i,
                        })),
                    }
                    : undefined,
            },
            include: { addons: true },
        });
    }
    async linkAddonGroupToItem(merchantProfileId, storeId, menuItemId, groupId) {
        await this.assertStoreOwnership(merchantProfileId, storeId);
        const [item, group] = await Promise.all([
            this.prisma.restaurantMenuItem.findFirst({ where: { id: menuItemId, storeId } }),
            this.prisma.restaurantAddonGroup.findFirst({ where: { id: groupId, storeId } }),
        ]);
        if (!item || !group)
            throw new common_1.NotFoundException('Menu item or addon group not found');
        return this.prisma.restaurantMenuItemAddonGroup.upsert({
            where: { menuItemId_groupId: { menuItemId, groupId } },
            create: { menuItemId, groupId },
            update: {},
        });
    }
    async createCombo(merchantProfileId, storeId, dto) {
        await this.assertStoreOwnership(merchantProfileId, storeId);
        if (!dto.items?.length)
            throw new common_1.BadRequestException('Combo must include at least one item');
        const slug = dto.slug ?? (0, vertical_constants_1.slugifyMenu)(dto.name);
        return this.prisma.restaurantCombo.create({
            data: {
                storeId,
                name: dto.name,
                slug,
                description: dto.description,
                imageUrl: dto.imageUrl,
                comboPrice: dto.comboPrice,
                sortOrder: dto.sortOrder ?? 0,
                items: {
                    create: dto.items.map((it, i) => ({
                        menuItemId: it.menuItemId,
                        quantity: it.quantity ?? 1,
                        sortOrder: i,
                    })),
                },
            },
            include: { items: { include: { menuItem: true } } },
        });
    }
    async upsertSearchIndex(menuItemId) {
        const item = await this.prisma.restaurantMenuItem.findUnique({
            where: { id: menuItemId },
            include: { category: true },
        });
        if (!item)
            return;
        const searchText = [item.name, item.description, item.cuisineName, item.category.name]
            .filter(Boolean)
            .join(' ');
        await this.prisma.$executeRaw `
      INSERT INTO restaurant_menu_search_index (id, store_id, menu_item_id, name, description, cuisine_name, category_name, diet_type, search_vector, updated_at)
      VALUES (
        ${`rms_${menuItemId}`},
        ${item.storeId},
        ${item.id},
        ${item.name},
        ${item.description},
        ${item.cuisineName},
        ${item.category.name},
        ${item.dietType}::"DietType",
        to_tsvector('english', ${searchText}),
        NOW()
      )
      ON CONFLICT (menu_item_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        cuisine_name = EXCLUDED.cuisine_name,
        category_name = EXCLUDED.category_name,
        diet_type = EXCLUDED.diet_type,
        search_vector = EXCLUDED.search_vector,
        updated_at = NOW()
    `;
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        store_category_access_service_1.StoreCategoryAccessService,
        vertical_service_1.VerticalService,
        buyer_cache_service_1.BuyerCacheService])
], MenuService);
//# sourceMappingURL=menu.service.js.map