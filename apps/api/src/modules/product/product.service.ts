import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DomainEventType,
  Inventory,
  Prisma,
  Product,
  ProductVariant,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { MerchantService } from '../merchant/merchant.service';
import { CreateProductDto, CreateVariantDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { UpdateProductStatusDto } from './dto/update-status.dto';
import { StoreCategoryAccessService } from '../category-governance/store-category-access.service';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryCacheService } from '../inventory/inventory-cache.service';
import {
  isFssaiRequiredCategory,
  isHsnRequiredCategory,
} from '../../common/utils/product-compliance.util';
import { pickReturnPolicyPrismaData } from '../../common/utils/product-return-policy-fields.util';
import { assertSafeExternalHttpsUrls } from '../../common/utils/safe-external-url.util';
import { ListProductsDto } from './dto/list-products.dto';

type VariantWithInventory = ProductVariant & { inventory: Inventory | null };

type ProductWithRelations = Product & {
  variants: VariantWithInventory[];
  category: { id: string; name: string; slug: string } | null;
};

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly storeCategoryAccess: StoreCategoryAccessService,
    private readonly inventoryService: InventoryService,
    private readonly inventoryCache: InventoryCacheService,
  ) {}

  // ---------------------------------------------------------------------------
  // Create product
  // ---------------------------------------------------------------------------

  async createProduct(
    userId: string,
    storeId: string,
    dto: CreateProductDto,
    ipAddress?: string,
  ): Promise<ProductWithRelations> {
    await this.assertStoreOwnership(userId, storeId);

    // Validate MRP ≥ basePrice
    if (dto.mrp !== undefined && dto.mrp < dto.basePrice) {
      throw new BadRequestException('Selling price (basePrice) cannot exceed MRP');
    }

    // Validate category is approved for merchant
    if (dto.categoryId) {
      await this.validateProductCategory(storeId, dto.categoryId);
    }

    await this.validateProductTaxCompliance(storeId, dto.categoryId, dto);

    // Check product-level SKU uniqueness within store
    if (dto.sku) {
      await this.assertSkuUnique(storeId, dto.sku);
    }

    // Validate all variant SKUs are unique within the store
    if (dto.variants?.length) {
      for (const v of dto.variants) {
        if (dto.mrp !== undefined && v.mrp !== undefined && v.mrp < v.price) {
          throw new BadRequestException(
            `Variant "${v.name}" selling price cannot exceed its MRP`,
          );
        }
        await this.assertVariantSkuUnique(storeId, v.sku);
      }
    }

    assertSafeExternalHttpsUrls(dto.imageUrls);

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
          ...pickReturnPolicyPrismaData(dto),
        },
      });

      // Build all variants to create
      const variantsToCreate: CreateVariantDto[] = [];

      // Always create a default variant (even for single-variant products)
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

      // Additional variants from DTO
      if (dto.variants?.length) {
        for (const v of dto.variants) {
          variantsToCreate.push({ ...v, isDefault: false });
        }
      }

      // Create variants + inventory in sequence
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

      // Create / upsert search index entry
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
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.PRODUCT_CREATED,
        'product',
        product.id,
        { storeId, name: product.name, slug: product.slug },
        { userId, ipAddress: ipAddress ?? null },
      ),
      this.inventoryCache.invalidateForStores([storeId]),
    ]);

    this.logger.log({ userId, storeId, productId: product.id }, 'Product created');
    return this.fetchProductWithRelations(product.id);
  }

  // ---------------------------------------------------------------------------
  // List products
  // ---------------------------------------------------------------------------

  async listProducts(
    userId: string,
    storeId: string,
    dto: ListProductsDto,
  ): Promise<{ products: ProductWithRelations[]; total: number }> {
    await this.assertStoreOwnership(userId, storeId);

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
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
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products: products as ProductWithRelations[], total };
  }

  // ---------------------------------------------------------------------------
  // Get single product
  // ---------------------------------------------------------------------------

  async getProduct(
    userId: string,
    storeId: string,
    productId: string,
  ): Promise<ProductWithRelations> {
    await this.assertStoreOwnership(userId, storeId);
    return this.fetchProductWithRelations(productId, storeId);
  }

  // ---------------------------------------------------------------------------
  // Update product
  // ---------------------------------------------------------------------------

  async updateProduct(
    userId: string,
    storeId: string,
    productId: string,
    dto: UpdateProductDto,
    ipAddress?: string,
  ): Promise<ProductWithRelations> {
    await this.assertStoreOwnership(userId, storeId);
    const product = await this.fetchProductWithRelations(productId, storeId);

    // Validate MRP vs price
    const effectiveMrp = dto.mrp ?? (product.mrp ? Number(product.mrp) : undefined);
    const effectivePrice = dto.basePrice ?? Number(product.basePrice);
    if (effectiveMrp !== undefined && effectivePrice > effectiveMrp) {
      throw new BadRequestException('Selling price (basePrice) cannot exceed MRP');
    }

    // SKU uniqueness (if changing)
    if (dto.sku && dto.sku !== product.sku) {
      await this.assertSkuUnique(storeId, dto.sku, productId);
    }

    if (dto.categoryId) {
      await this.validateProductCategory(storeId, dto.categoryId);
    }

    await this.validateProductTaxCompliance(storeId, dto.categoryId, dto, product);

    if (dto.imageUrls !== undefined && dto.imageUrls.length === 0) {
      throw new BadRequestException('At least one product image is required');
    }
    if (dto.imageUrls !== undefined) {
      assertSafeExternalHttpsUrls(dto.imageUrls);
    }

    // Regenerate slug if name changed
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
          ...pickReturnPolicyPrismaData(dto),
        },
      });

      // Sync default variant price if basePrice or mrp changed
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

      // Refresh search index
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
        metadata: { changedFields: Object.keys(dto) } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.PRODUCT_UPDATED,
        'product',
        productId,
        { storeId, changedFields: Object.keys(dto) },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    void this.inventoryCache.invalidateForStores([storeId]);

    return this.fetchProductWithRelations(productId);
  }

  // ---------------------------------------------------------------------------
  // Soft-delete product
  // ---------------------------------------------------------------------------

  async deleteProduct(
    userId: string,
    storeId: string,
    productId: string,
    ipAddress?: string,
  ): Promise<void> {
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
      this.domainEvents.emit(
        DomainEventType.PRODUCT_DELETED,
        'product',
        productId,
        { storeId },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);
  }

  // ---------------------------------------------------------------------------
  // Update inventory
  // ---------------------------------------------------------------------------

  async updateInventory(
    userId: string,
    storeId: string,
    productId: string,
    variantId: string,
    dto: UpdateInventoryDto,
    ipAddress?: string,
  ): Promise<Inventory> {
    await this.assertStoreOwnership(userId, storeId);
    await this.assertVariantBelongsToProduct(variantId, productId, storeId);

    const inventory = await this.prisma.inventory.findUnique({
      where: { variantId },
    });
    if (!inventory) throw new NotFoundException(`Inventory not found for variant: ${variantId}`);

    const previousQty = inventory.availableQty;

    const updated = await this.inventoryService.adjustAvailableQty(
      variantId,
      dto.quantity,
      dto.lowStockThreshold,
      userId,
    );

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
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.INVENTORY_CHANGED,
        'inventory',
        inventory.id,
        {
          productId,
          variantId,
          storeId,
          previousQty,
          newQty: dto.quantity,
          isLowStock: dto.quantity <= (dto.lowStockThreshold ?? inventory.lowStockThreshold),
        },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    return this.prisma.inventory.findUniqueOrThrow({ where: { variantId } });
  }

  // ---------------------------------------------------------------------------
  // Update price
  // ---------------------------------------------------------------------------

  async updatePrice(
    userId: string,
    storeId: string,
    productId: string,
    variantId: string,
    dto: UpdatePriceDto,
    ipAddress?: string,
  ): Promise<ProductVariant> {
    await this.assertStoreOwnership(userId, storeId);
    const variant = await this.assertVariantBelongsToProduct(variantId, productId, storeId);

    const effectiveMrp = dto.mrp ?? (variant.mrp ? Number(variant.mrp) : undefined);
    if (effectiveMrp !== undefined && dto.price > effectiveMrp) {
      throw new BadRequestException(
        `Selling price (${dto.price}) cannot exceed MRP (${effectiveMrp})`,
      );
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

      // Keep product.basePrice in sync if this is the default variant
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
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.PRICE_CHANGED,
        'product_variant',
        variantId,
        { productId, storeId, previousPrice, newPrice: dto.price },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Update product status (active/inactive)
  // ---------------------------------------------------------------------------

  async updateStatus(
    userId: string,
    storeId: string,
    productId: string,
    dto: UpdateProductStatusDto,
    ipAddress?: string,
  ): Promise<{ id: string; isActive: boolean }> {
    await this.assertStoreOwnership(userId, storeId);
    const product = await this.fetchProductWithRelations(productId, storeId);

    if (dto.isActive && (!product.imageUrls || product.imageUrls.length === 0)) {
      throw new BadRequestException('Product must have at least one image before activation');
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
      metadata: { storeId, isActive: dto.isActive } as Prisma.InputJsonValue,
    });

    void this.inventoryCache.invalidateForStores([storeId]);

    return updated[0];
  }

  // ---------------------------------------------------------------------------
  // Public helpers
  // ---------------------------------------------------------------------------

  async resolveDefaultVariantId(productId: string): Promise<string> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { productId, isDefault: true },
      select: { id: true },
    });
    if (!variant) throw new NotFoundException(`No default variant found for product ${productId}`);
    return variant.id;
  }

  async fetchProductWithRelations(
    productId: string,
    storeId?: string,
  ): Promise<ProductWithRelations> {
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

    if (!product) throw new NotFoundException(`Product not found: ${productId}`);
    if (storeId && product.storeId !== storeId) {
      throw new ForbiddenException('Product does not belong to this store');
    }

    return product as ProductWithRelations;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async validateProductTaxCompliance(
    storeId: string,
    categoryId: string | null | undefined,
    dto: {
      hsnCodeId?: string;
      gstSlab?: string;
      taxCategory?: string;
      fssaiLicense?: string;
    },
    existingProduct?: { fssaiLicense: string | null },
  ): Promise<void> {
    if (!categoryId) return;
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { slug: true, name: true },
    });
    if (!category) return;

    const taxCat = dto.taxCategory ?? 'GOODS';
    if (taxCat === 'EXEMPT' || taxCat === 'NIL_RATED') return;

    const needsHsn = isHsnRequiredCategory(category);
    const needsFssai = isFssaiRequiredCategory(category);

    if (!needsHsn && !needsFssai) return;

    if (needsHsn && !dto.hsnCodeId) {
      throw new BadRequestException('HSN code is required for this product category');
    }

    if (needsFssai) {
      const fssai =
        dto.fssaiLicense?.trim() ||
        existingProduct?.fssaiLicense?.trim() ||
        (await this.findStoreFssaiLicense(storeId));
      if (!fssai) {
        throw new BadRequestException('FSSAI license is required for this product category');
      }
      if (!dto.fssaiLicense?.trim()) {
        dto.fssaiLicense = fssai;
      }
    }
  }

  /** Reuse FSSAI from any product in the store (merchant enters once). */
  async findStoreFssaiLicense(storeId: string): Promise<string | null> {
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

  private async assertStoreOwnership(userId: string, storeId: string): Promise<void> {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
    });
    if (!store) throw new ForbiddenException('Store not found or not owned by you');
  }

  private async assertSkuUnique(
    storeId: string,
    sku: string,
    excludeProductId?: string,
  ): Promise<void> {
    const existing = await this.prisma.product.findFirst({
      where: {
        storeId,
        sku,
        deletedAt: null,
        ...(excludeProductId && { id: { not: excludeProductId } }),
      },
    });
    if (existing) {
      throw new BadRequestException(`SKU "${sku}" is already in use in this store`);
    }
  }

  private async assertVariantSkuUnique(
    storeId: string,
    sku: string,
    excludeVariantId?: string,
  ): Promise<void> {
    const existing = await this.prisma.productVariant.findFirst({
      where: {
        sku,
        product: { storeId, deletedAt: null },
        ...(excludeVariantId && { id: { not: excludeVariantId } }),
      },
    });
    if (existing) {
      throw new BadRequestException(`Variant SKU "${sku}" is already in use in this store`);
    }
  }

  private async assertVariantBelongsToProduct(
    variantId: string,
    productId: string,
    storeId: string,
  ): Promise<ProductVariant> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId, product: { storeId } },
    });
    if (!variant) {
      throw new NotFoundException(`Variant ${variantId} not found on product ${productId}`);
    }
    return variant;
  }

  private async validateProductCategory(
    storeId: string,
    categoryId: string,
  ): Promise<void> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: { merchantProfileId: true },
    });
    if (!store) throw new NotFoundException('Store not found');

    const cat = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) throw new BadRequestException(`Category not found: ${categoryId}`);

    if (cat.storeId === null && cat.scope === 'GLOBAL') {
      await this.storeCategoryAccess.assertProductCategoryAllowed(
        storeId,
        store.merchantProfileId,
        categoryId,
      );
    } else if (cat.storeId !== storeId) {
      throw new ForbiddenException('Category does not belong to this store');
    }
  }

  private async generateUniqueProductSlug(
    storeId: string,
    name: string,
    excludeProductId?: string,
  ): Promise<string> {
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
      if (!existing) return slug;
      slug = `${base}-${counter++}`;
    }
  }
}
