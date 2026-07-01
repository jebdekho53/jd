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
var ProductService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const merchant_service_1 = require("../merchant/merchant.service");
const store_category_access_service_1 = require("../category-governance/store-category-access.service");
const inventory_service_1 = require("../inventory/inventory.service");
const inventory_cache_service_1 = require("../inventory/inventory-cache.service");
const product_compliance_util_1 = require("../../common/utils/product-compliance.util");
const product_return_policy_fields_util_1 = require("../../common/utils/product-return-policy-fields.util");
const safe_external_url_util_1 = require("../../common/utils/safe-external-url.util");
const hsn_code_util_1 = require("./hsn-code.util");
let ProductService = ProductService_1 = class ProductService {
    constructor(prisma, merchantService, audit, domainEvents, storeCategoryAccess, inventoryService, inventoryCache) {
        this.prisma = prisma;
        this.merchantService = merchantService;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.storeCategoryAccess = storeCategoryAccess;
        this.inventoryService = inventoryService;
        this.inventoryCache = inventoryCache;
        this.logger = new common_1.Logger(ProductService_1.name);
    }
    async createProduct(userId, storeId, dto, ipAddress) {
        await this.assertStoreOwnership(userId, storeId);
        if (dto.mrp !== undefined && dto.mrp < dto.basePrice) {
            throw new common_1.BadRequestException('Selling price (basePrice) cannot exceed MRP');
        }
        if (dto.categoryId) {
            await this.validateProductCategory(storeId, dto.categoryId);
        }
        await this.validateProductTaxCompliance(storeId, dto.categoryId, dto);
        if (dto.sku) {
            await this.assertSkuUnique(storeId, dto.sku);
        }
        if (dto.variants?.length) {
            for (const v of dto.variants) {
                if (dto.mrp !== undefined && v.mrp !== undefined && v.mrp < v.price) {
                    throw new common_1.BadRequestException(`Variant "${v.name}" selling price cannot exceed its MRP`);
                }
                await this.assertVariantSkuUnique(storeId, v.sku);
            }
        }
        (0, safe_external_url_util_1.assertSafeExternalHttpsUrls)(dto.imageUrls);
        const slug = await this.generateUniqueProductSlug(storeId, dto.name);
        const product = await this.prisma.$transaction(async (tx) => {
            const created = await tx.product.create({
                data: {
                    storeId,
                    name: dto.name,
                    slug,
                    description: dto.description,
                    brand: dto.brand,
                    sku: dto.sku,
                    categoryId: dto.categoryId,
                    imageUrls: dto.imageUrls,
                    basePrice: dto.basePrice,
                    mrp: dto.mrp,
                    unit: dto.unit ?? 'piece',
                    weightGrams: dto.weightGrams,
                    tags: dto.tags ?? [],
                    isVeg: dto.isVeg,
                    sortOrder: dto.sortOrder ?? 0,
                    isActive: true,
                    ingredients: dto.ingredients,
                    shelfLife: dto.shelfLife,
                    countryOfOrigin: dto.countryOfOrigin,
                    manufacturerName: dto.manufacturerName,
                    manufacturerAddress: dto.manufacturerAddress,
                    fssaiLicense: dto.fssaiLicense,
                    storageInstructions: dto.storageInstructions,
                    disclaimer: dto.disclaimer,
                    taxInclusive: dto.taxInclusive ?? false,
                    hsnCodeId: dto.hsnCodeId,
                    gstSlab: dto.gstSlab,
                    taxCategory: dto.taxCategory,
                    ...(0, product_return_policy_fields_util_1.pickReturnPolicyPrismaData)(dto),
                },
            });
            const variantsToCreate = [];
            variantsToCreate.push({
                sku: dto.sku ?? `${slug}-default`,
                name: 'Default',
                price: dto.basePrice,
                mrp: dto.mrp,
                weightGrams: dto.weightGrams,
                quantity: dto.quantity ?? 0,
                lowStockThreshold: dto.lowStockThreshold ?? 5,
                isDefault: true,
            });
            if (dto.variants?.length) {
                for (const v of dto.variants) {
                    variantsToCreate.push({ ...v, isDefault: false });
                }
            }
            for (const v of variantsToCreate) {
                const variant = await tx.productVariant.create({
                    data: {
                        productId: created.id,
                        sku: v.sku,
                        name: v.name,
                        price: v.price,
                        mrp: v.mrp,
                        weightGrams: v.weightGrams,
                        isDefault: v.isDefault ?? false,
                        isActive: true,
                    },
                });
                await tx.inventory.create({
                    data: {
                        variantId: variant.id,
                        availableQty: v.quantity ?? 0,
                        reservedQty: 0,
                        soldQty: 0,
                        lowStockThreshold: v.lowStockThreshold ?? 5,
                        version: 0,
                    },
                });
            }
            const categoryName = dto.categoryId
                ? (await tx.category.findUnique({ where: { id: dto.categoryId } }))?.name
                : undefined;
            const searchText = [
                dto.name,
                dto.brand,
                dto.description,
                categoryName,
                ...(dto.tags ?? []),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            await tx.productSearchIndex.upsert({
                where: { productId: created.id },
                update: {
                    name: dto.name,
                    description: dto.description,
                    categoryName,
                    brand: dto.brand,
                    tags: dto.tags ?? [],
                    searchText,
                    isActive: true,
                },
                create: {
                    productId: created.id,
                    storeId,
                    name: dto.name,
                    description: dto.description,
                    categoryName,
                    brand: dto.brand,
                    tags: dto.tags ?? [],
                    searchText,
                    isActive: true,
                },
            });
            return created;
        });
        await Promise.all([
            this.audit.log({
                actorId: userId,
                action: 'PRODUCT_CREATED',
                resourceType: 'product',
                resourceId: product.id,
                ipAddress,
                metadata: {
                    name: product.name,
                    storeId,
                    sku: dto.sku,
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.PRODUCT_CREATED, 'product', product.id, { storeId, name: product.name, slug: product.slug }, { userId, ipAddress: ipAddress ?? null }),
            this.inventoryCache.invalidateForStores([storeId]),
        ]);
        this.logger.log({ userId, storeId, productId: product.id }, 'Product created');
        return this.fetchProductWithRelations(product.id);
    }
    async listProducts(userId, storeId, dto) {
        await this.assertStoreOwnership(userId, storeId);
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
            storeId,
            deletedAt: null,
            ...(dto.categoryId && { categoryId: dto.categoryId }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            ...(dto.search && {
                name: { contains: dto.search, mode: 'insensitive' },
            }),
        };
        const [products, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where,
                include: {
                    variants: { include: { inventory: true }, orderBy: { isDefault: 'desc' } },
                    category: { select: { id: true, name: true, slug: true } },
                    hsnCodeRef: { select: { id: true, code: true, description: true, defaultGstSlab: true } },
                },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
                skip,
                take: limit,
            }),
            this.prisma.product.count({ where }),
        ]);
        return { products: products, total };
    }
    async getProduct(userId, storeId, productId) {
        await this.assertStoreOwnership(userId, storeId);
        return this.fetchProductWithRelations(productId, storeId);
    }
    async updateProduct(userId, storeId, productId, dto, ipAddress) {
        await this.assertStoreOwnership(userId, storeId);
        const product = await this.fetchProductWithRelations(productId, storeId);
        const effectiveMrp = dto.mrp ?? (product.mrp ? Number(product.mrp) : undefined);
        const effectivePrice = dto.basePrice ?? Number(product.basePrice);
        if (effectiveMrp !== undefined && effectivePrice > effectiveMrp) {
            throw new common_1.BadRequestException('Selling price (basePrice) cannot exceed MRP');
        }
        if (dto.sku && dto.sku !== product.sku) {
            await this.assertSkuUnique(storeId, dto.sku, productId);
        }
        if (dto.categoryId) {
            await this.validateProductCategory(storeId, dto.categoryId);
        }
        await this.validateProductTaxCompliance(storeId, dto.categoryId, dto, product);
        if (dto.imageUrls !== undefined && dto.imageUrls.length === 0) {
            throw new common_1.BadRequestException('At least one product image is required');
        }
        if (dto.imageUrls !== undefined) {
            (0, safe_external_url_util_1.assertSafeExternalHttpsUrls)(dto.imageUrls);
        }
        let slug = product.slug;
        if (dto.name && dto.name !== product.name) {
            slug = await this.generateUniqueProductSlug(storeId, dto.name, productId);
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.product.update({
                where: { id: productId },
                data: {
                    ...(dto.name !== undefined && { name: dto.name, slug }),
                    ...(dto.description !== undefined && { description: dto.description }),
                    ...(dto.brand !== undefined && { brand: dto.brand }),
                    ...(dto.sku !== undefined && { sku: dto.sku }),
                    ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
                    ...(dto.imageUrls !== undefined && { imageUrls: dto.imageUrls }),
                    ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
                    ...(dto.mrp !== undefined && { mrp: dto.mrp }),
                    ...(dto.unit !== undefined && { unit: dto.unit }),
                    ...(dto.weightGrams !== undefined && { weightGrams: dto.weightGrams }),
                    ...(dto.tags !== undefined && { tags: dto.tags }),
                    ...(dto.isVeg !== undefined && { isVeg: dto.isVeg }),
                    ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
                    ...(dto.ingredients !== undefined && { ingredients: dto.ingredients }),
                    ...(dto.shelfLife !== undefined && { shelfLife: dto.shelfLife }),
                    ...(dto.countryOfOrigin !== undefined && { countryOfOrigin: dto.countryOfOrigin }),
                    ...(dto.manufacturerName !== undefined && { manufacturerName: dto.manufacturerName }),
                    ...(dto.manufacturerAddress !== undefined && { manufacturerAddress: dto.manufacturerAddress }),
                    ...(dto.fssaiLicense !== undefined && { fssaiLicense: dto.fssaiLicense }),
                    ...(dto.storageInstructions !== undefined && { storageInstructions: dto.storageInstructions }),
                    ...(dto.disclaimer !== undefined && { disclaimer: dto.disclaimer }),
                    ...(dto.taxInclusive !== undefined && { taxInclusive: dto.taxInclusive }),
                    ...(dto.hsnCodeId !== undefined && { hsnCodeId: dto.hsnCodeId }),
                    ...(dto.gstSlab !== undefined && { gstSlab: dto.gstSlab }),
                    ...(dto.taxCategory !== undefined && { taxCategory: dto.taxCategory }),
                    ...(0, product_return_policy_fields_util_1.pickReturnPolicyPrismaData)(dto),
                },
            });
            if (dto.basePrice !== undefined || dto.mrp !== undefined) {
                const defaultVariant = product.variants.find((v) => v.isDefault);
                if (defaultVariant) {
                    await tx.productVariant.update({
                        where: { id: defaultVariant.id },
                        data: {
                            ...(dto.basePrice !== undefined && { price: dto.basePrice }),
                            ...(dto.mrp !== undefined && { mrp: dto.mrp }),
                        },
                    });
                }
            }
            const catName = dto.categoryId
                ? (await tx.category.findUnique({ where: { id: dto.categoryId } }))?.name
                : product.category?.name;
            const searchText = [
                dto.name ?? product.name,
                dto.brand ?? product.brand,
                dto.description ?? product.description,
                catName,
                ...(dto.tags ?? product.tags),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            await tx.productSearchIndex.upsert({
                where: { productId },
                update: {
                    name: dto.name ?? product.name,
                    description: dto.description ?? product.description,
                    brand: dto.brand ?? product.brand,
                    categoryName: catName,
                    tags: dto.tags ?? product.tags,
                    searchText,
                },
                create: {
                    productId,
                    storeId,
                    name: dto.name ?? product.name,
                    description: dto.description ?? product.description,
                    brand: dto.brand ?? product.brand,
                    categoryName: catName,
                    tags: dto.tags ?? product.tags,
                    searchText,
                    isActive: true,
                },
            });
        });
        await Promise.all([
            this.audit.log({
                actorId: userId,
                action: 'PRODUCT_UPDATED',
                resourceType: 'product',
                resourceId: productId,
                ipAddress,
                metadata: { changedFields: Object.keys(dto) },
            }),
            this.domainEvents.emit(client_1.DomainEventType.PRODUCT_UPDATED, 'product', productId, { storeId, changedFields: Object.keys(dto) }, { userId, ipAddress: ipAddress ?? null }),
        ]);
        void this.inventoryCache.invalidateForStores([storeId]);
        return this.fetchProductWithRelations(productId);
    }
    async deleteProduct(userId, storeId, productId, ipAddress) {
        await this.assertStoreOwnership(userId, storeId);
        await this.fetchProductWithRelations(productId, storeId);
        await this.prisma.$transaction([
            this.prisma.product.update({
                where: { id: productId },
                data: { deletedAt: new Date(), isActive: false },
            }),
            this.prisma.productSearchIndex.updateMany({
                where: { productId },
                data: { isActive: false },
            }),
        ]);
        await Promise.all([
            this.audit.log({
                actorId: userId,
                action: 'PRODUCT_DELETED',
                resourceType: 'product',
                resourceId: productId,
                ipAddress,
            }),
            this.domainEvents.emit(client_1.DomainEventType.PRODUCT_DELETED, 'product', productId, { storeId }, { userId, ipAddress: ipAddress ?? null }),
        ]);
    }
    async updateInventory(userId, storeId, productId, variantId, dto, ipAddress) {
        await this.assertStoreOwnership(userId, storeId);
        await this.assertVariantBelongsToProduct(variantId, productId, storeId);
        const inventory = await this.prisma.inventory.findUnique({
            where: { variantId },
        });
        if (!inventory)
            throw new common_1.NotFoundException(`Inventory not found for variant: ${variantId}`);
        const previousQty = inventory.availableQty;
        const updated = await this.inventoryService.adjustAvailableQty(variantId, dto.quantity, dto.lowStockThreshold, userId);
        await Promise.all([
            this.audit.log({
                actorId: userId,
                action: 'INVENTORY_UPDATED',
                resourceType: 'inventory',
                resourceId: inventory.id,
                ipAddress,
                metadata: {
                    productId,
                    variantId,
                    previousQty,
                    newQty: dto.quantity,
                    delta: dto.quantity - previousQty,
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.INVENTORY_CHANGED, 'inventory', inventory.id, {
                productId,
                variantId,
                storeId,
                previousQty,
                newQty: dto.quantity,
                isLowStock: dto.quantity <= (dto.lowStockThreshold ?? inventory.lowStockThreshold),
            }, { userId, ipAddress: ipAddress ?? null }),
        ]);
        return this.prisma.inventory.findUniqueOrThrow({ where: { variantId } });
    }
    async updatePrice(userId, storeId, productId, variantId, dto, ipAddress) {
        await this.assertStoreOwnership(userId, storeId);
        const variant = await this.assertVariantBelongsToProduct(variantId, productId, storeId);
        const effectiveMrp = dto.mrp ?? (variant.mrp ? Number(variant.mrp) : undefined);
        if (effectiveMrp !== undefined && dto.price > effectiveMrp) {
            throw new common_1.BadRequestException(`Selling price (${dto.price}) cannot exceed MRP (${effectiveMrp})`);
        }
        const previousPrice = Number(variant.price);
        const updated = await this.prisma.$transaction(async (tx) => {
            const v = await tx.productVariant.update({
                where: { id: variantId },
                data: {
                    price: dto.price,
                    ...(dto.mrp !== undefined && { mrp: dto.mrp }),
                },
            });
            if (variant.isDefault) {
                await tx.product.update({
                    where: { id: productId },
                    data: {
                        basePrice: dto.price,
                        ...(dto.mrp !== undefined && { mrp: dto.mrp }),
                    },
                });
            }
            return v;
        });
        await Promise.all([
            this.audit.log({
                actorId: userId,
                action: 'PRICE_UPDATED',
                resourceType: 'product_variant',
                resourceId: variantId,
                ipAddress,
                metadata: {
                    productId,
                    variantId,
                    previousPrice,
                    newPrice: dto.price,
                    mrp: dto.mrp,
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.PRICE_CHANGED, 'product_variant', variantId, { productId, storeId, previousPrice, newPrice: dto.price }, { userId, ipAddress: ipAddress ?? null }),
        ]);
        return updated;
    }
    async updateStatus(userId, storeId, productId, dto, ipAddress) {
        await this.assertStoreOwnership(userId, storeId);
        const product = await this.fetchProductWithRelations(productId, storeId);
        if (dto.isActive && (!product.imageUrls || product.imageUrls.length === 0)) {
            throw new common_1.BadRequestException('Product must have at least one image before activation');
        }
        const updated = await this.prisma.$transaction([
            this.prisma.product.update({
                where: { id: productId },
                data: { isActive: dto.isActive },
                select: { id: true, isActive: true },
            }),
            this.prisma.productSearchIndex.updateMany({
                where: { productId },
                data: { isActive: dto.isActive },
            }),
        ]);
        await this.audit.log({
            actorId: userId,
            action: dto.isActive ? 'PRODUCT_ACTIVATED' : 'PRODUCT_DEACTIVATED',
            resourceType: 'product',
            resourceId: productId,
            ipAddress,
            metadata: { storeId, isActive: dto.isActive },
        });
        void this.inventoryCache.invalidateForStores([storeId]);
        return updated[0];
    }
    async resolveDefaultVariantId(productId) {
        const variant = await this.prisma.productVariant.findFirst({
            where: { productId, isDefault: true },
            select: { id: true },
        });
        if (!variant)
            throw new common_1.NotFoundException(`No default variant found for product ${productId}`);
        return variant.id;
    }
    async fetchProductWithRelations(productId, storeId) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId, deletedAt: null },
            include: {
                variants: {
                    where: { isActive: true },
                    include: { inventory: true },
                    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
                },
                category: { select: { id: true, name: true, slug: true } },
                hsnCodeRef: { select: { id: true, code: true, description: true, defaultGstSlab: true } },
            },
        });
        if (!product)
            throw new common_1.NotFoundException(`Product not found: ${productId}`);
        if (storeId && product.storeId !== storeId) {
            throw new common_1.ForbiddenException('Product does not belong to this store');
        }
        return product;
    }
    async validateProductTaxCompliance(storeId, categoryId, dto, existingProduct) {
        const effectiveHsnCodeId = dto.hsnCodeId === undefined ? existingProduct?.hsnCodeId : dto.hsnCodeId;
        if (!effectiveHsnCodeId?.trim()) {
            throw new common_1.BadRequestException('HSN code is required for every product');
        }
        await this.assertActiveHsnCode(effectiveHsnCodeId.trim());
        let category = null;
        if (categoryId) {
            category = await this.prisma.category.findUnique({
                where: { id: categoryId },
                select: { slug: true, name: true },
            });
        }
        if (!category)
            return;
        const taxCat = dto.taxCategory ?? 'GOODS';
        if (taxCat === 'EXEMPT' || taxCat === 'NIL_RATED')
            return;
        const needsFssai = (0, product_compliance_util_1.isFssaiRequiredCategory)({ slug: category.slug ?? '', name: category.name });
        if (!needsFssai)
            return;
        if (needsFssai) {
            const fssai = dto.fssaiLicense?.trim() ||
                existingProduct?.fssaiLicense?.trim() ||
                (await this.findStoreFssaiLicense(storeId));
            if (!fssai) {
                throw new common_1.BadRequestException('FSSAI license is required for this product category');
            }
            if (!dto.fssaiLicense?.trim()) {
                dto.fssaiLicense = fssai;
            }
        }
    }
    async assertActiveHsnCode(hsnCodeId) {
        const hsn = await this.prisma.hSNCode.findFirst({
            where: { id: hsnCodeId, isActive: true },
            select: { code: true },
        });
        if (!hsn) {
            throw new common_1.BadRequestException('Selected HSN code is invalid or inactive');
        }
        if (!(0, hsn_code_util_1.isValidHsnCode)(hsn.code)) {
            throw new common_1.BadRequestException('HSN code must be numeric and 4, 6, or 8 digits');
        }
    }
    async findStoreFssaiLicense(storeId) {
        const row = await this.prisma.product.findFirst({
            where: {
                storeId,
                deletedAt: null,
                fssaiLicense: { not: null },
                NOT: { fssaiLicense: '' },
            },
            orderBy: { updatedAt: 'desc' },
            select: { fssaiLicense: true },
        });
        return row?.fssaiLicense?.trim() || null;
    }
    async assertStoreOwnership(userId, storeId) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
        });
        if (!store)
            throw new common_1.ForbiddenException('Store not found or not owned by you');
    }
    async assertSkuUnique(storeId, sku, excludeProductId) {
        const existing = await this.prisma.product.findFirst({
            where: {
                storeId,
                sku,
                deletedAt: null,
                ...(excludeProductId && { id: { not: excludeProductId } }),
            },
        });
        if (existing) {
            throw new common_1.BadRequestException(`SKU "${sku}" is already in use in this store`);
        }
    }
    async assertVariantSkuUnique(storeId, sku, excludeVariantId) {
        const existing = await this.prisma.productVariant.findFirst({
            where: {
                sku,
                product: { storeId, deletedAt: null },
                ...(excludeVariantId && { id: { not: excludeVariantId } }),
            },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Variant SKU "${sku}" is already in use in this store`);
        }
    }
    async assertVariantBelongsToProduct(variantId, productId, storeId) {
        const variant = await this.prisma.productVariant.findFirst({
            where: { id: variantId, productId, product: { storeId } },
        });
        if (!variant) {
            throw new common_1.NotFoundException(`Variant ${variantId} not found on product ${productId}`);
        }
        return variant;
    }
    async validateProductCategory(storeId, categoryId) {
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, deletedAt: null },
            select: { merchantProfileId: true },
        });
        if (!store)
            throw new common_1.NotFoundException('Store not found');
        const cat = await this.prisma.category.findUnique({ where: { id: categoryId } });
        if (!cat)
            throw new common_1.BadRequestException(`Category not found: ${categoryId}`);
        if (cat.storeId === null && cat.scope === 'GLOBAL') {
            await this.storeCategoryAccess.assertProductCategoryAllowed(storeId, store.merchantProfileId, categoryId);
        }
        else if (cat.storeId !== storeId) {
            throw new common_1.ForbiddenException('Category does not belong to this store');
        }
    }
    async generateUniqueProductSlug(storeId, name, excludeProductId) {
        const base = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            .slice(0, 60);
        let slug = base;
        let counter = 1;
        while (true) {
            const existing = await this.prisma.product.findFirst({
                where: {
                    storeId,
                    slug,
                    deletedAt: null,
                    ...(excludeProductId && { id: { not: excludeProductId } }),
                },
            });
            if (!existing)
                return slug;
            slug = `${base}-${counter++}`;
        }
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = ProductService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        merchant_service_1.MerchantService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        store_category_access_service_1.StoreCategoryAccessService,
        inventory_service_1.InventoryService,
        inventory_cache_service_1.InventoryCacheService])
], ProductService);
//# sourceMappingURL=product.service.js.map