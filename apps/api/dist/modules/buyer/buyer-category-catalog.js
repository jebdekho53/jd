"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVE_GLOBAL_CATEGORY_WHERE = void 0;
exports.resolveCategoryGrantScope = resolveCategoryGrantScope;
exports.fetchActiveGlobalCategories = fetchActiveGlobalCategories;
exports.fetchStoreVisibleCategories = fetchStoreVisibleCategories;
exports.fetchApprovedSubcategoryIds = fetchApprovedSubcategoryIds;
exports.fetchStoresForCategory = fetchStoresForCategory;
exports.assertActiveGlobalCategory = assertActiveGlobalCategory;
const client_1 = require("@prisma/client");
const buyer_visibility_util_1 = require("./buyer-visibility.util");
exports.ACTIVE_GLOBAL_CATEGORY_WHERE = {
    parentId: null,
    isActive: true,
    deletedAt: null,
    storeId: null,
    scope: client_1.CategoryScope.GLOBAL,
};
const categoryInclude = {
    children: {
        where: { isActive: true, deletedAt: null },
        select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            parentId: true,
            sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
    },
};
const GLOBAL_CATEGORY_SELECT = {
    id: true,
    parentId: true,
};
async function resolveCategoryGrantScope(prisma, categoryId, explicitSubcategoryId) {
    if (explicitSubcategoryId) {
        const sub = await prisma.category.findFirst({
            where: {
                id: explicitSubcategoryId,
                isActive: true,
                deletedAt: null,
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
            },
            select: GLOBAL_CATEGORY_SELECT,
        });
        if (!sub?.parentId)
            return null;
        return { parentCategoryId: sub.parentId, subcategoryIds: [explicitSubcategoryId] };
    }
    const cat = await prisma.category.findFirst({
        where: {
            id: categoryId,
            isActive: true,
            deletedAt: null,
            storeId: null,
            scope: client_1.CategoryScope.GLOBAL,
        },
        select: GLOBAL_CATEGORY_SELECT,
    });
    if (!cat)
        return null;
    if (cat.parentId) {
        return { parentCategoryId: cat.parentId, subcategoryIds: [cat.id] };
    }
    return { parentCategoryId: cat.id, subcategoryIds: [] };
}
function mapRows(rows) {
    return rows.map((c) => ({
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
async function fetchActiveGlobalCategories(prisma) {
    const rows = await prisma.category.findMany({
        where: exports.ACTIVE_GLOBAL_CATEGORY_WHERE,
        include: categoryInclude,
        orderBy: { sortOrder: 'asc' },
    });
    return mapRows(rows);
}
async function fetchStoreVisibleCategories(prisma, storeId) {
    const products = await prisma.product.findMany({
        where: { storeId, ...buyer_visibility_util_1.PRODUCT_VISIBLE_WHERE, categoryId: { not: null } },
        select: { categoryId: true },
    });
    const leafIds = [...new Set(products.map((p) => p.categoryId).filter(Boolean))];
    if (leafIds.length === 0)
        return [];
    const leafCategories = await prisma.category.findMany({
        where: {
            id: { in: leafIds },
            isActive: true,
            deletedAt: null,
            storeId: null,
            scope: client_1.CategoryScope.GLOBAL,
        },
        select: { id: true, parentId: true },
    });
    const visibleSubIds = new Set();
    const visibleParentIds = new Set();
    for (const leaf of leafCategories) {
        if (leaf.parentId) {
            visibleSubIds.add(leaf.id);
            visibleParentIds.add(leaf.parentId);
        }
        else {
            visibleParentIds.add(leaf.id);
        }
    }
    if (visibleSubIds.size === 0 && visibleParentIds.size === 0)
        return [];
    const rows = await prisma.category.findMany({
        where: {
            ...exports.ACTIVE_GLOBAL_CATEGORY_WHERE,
            id: { in: [...visibleParentIds] },
        },
        include: {
            children: {
                where: {
                    isActive: true,
                    deletedAt: null,
                    id: { in: [...visibleSubIds] },
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    imageUrl: true,
                    parentId: true,
                    sortOrder: true,
                },
                orderBy: { sortOrder: 'asc' },
            },
        },
        orderBy: { sortOrder: 'asc' },
    });
    return mapRows(rows.filter((r) => r.children.length > 0 || visibleParentIds.has(r.id)));
}
async function fetchApprovedSubcategoryIds(prisma, storeId) {
    const rows = await prisma.storeCategory.findMany({
        where: { storeId },
        select: { subcategoryId: true },
    });
    return rows.map((r) => r.subcategoryId);
}
async function resolveProductCategoryIds(prisma, scope) {
    if (scope.subcategoryIds.length > 0) {
        return scope.subcategoryIds;
    }
    const children = await prisma.category.findMany({
        where: {
            parentId: scope.parentCategoryId,
            isActive: true,
            deletedAt: null,
            storeId: null,
            scope: client_1.CategoryScope.GLOBAL,
        },
        select: { id: true },
    });
    const ids = children.map((c) => c.id);
    ids.push(scope.parentCategoryId);
    return ids;
}
async function fetchStoresForCategory(prisma, categoryId, subcategoryId) {
    const scope = await resolveCategoryGrantScope(prisma, categoryId, subcategoryId);
    if (!scope)
        return [];
    const categoryIdsForProducts = await resolveProductCategoryIds(prisma, scope);
    if (categoryIdsForProducts.length === 0)
        return [];
    const counts = await prisma.product.groupBy({
        by: ['storeId'],
        where: {
            categoryId: { in: categoryIdsForProducts },
            ...buyer_visibility_util_1.PRODUCT_VISIBLE_WHERE,
            store: buyer_visibility_util_1.STORE_VISIBLE_WHERE,
        },
        _count: { id: true },
    });
    return counts
        .map((c) => ({ storeId: c.storeId, productCount: c._count.id }))
        .filter((c) => c.productCount > 0);
}
async function assertActiveGlobalCategory(prisma, categoryId) {
    const cat = await prisma.category.findFirst({
        where: {
            id: categoryId,
            isActive: true,
            deletedAt: null,
            storeId: null,
            scope: client_1.CategoryScope.GLOBAL,
        },
        select: { id: true, parentId: true },
    });
    if (!cat) {
        throw new Error('Category is not available');
    }
    if (cat.parentId) {
        const parent = await prisma.category.findFirst({
            where: {
                id: cat.parentId,
                isActive: true,
                deletedAt: null,
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
            },
            select: { id: true },
        });
        if (!parent) {
            throw new Error('Category is not available');
        }
    }
}
//# sourceMappingURL=buyer-category-catalog.js.map