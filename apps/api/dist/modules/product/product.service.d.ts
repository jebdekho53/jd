import { Inventory, Product, ProductVariant } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { MerchantService } from '../merchant/merchant.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { UpdateProductStatusDto } from './dto/update-status.dto';
import { StoreCategoryAccessService } from '../category-governance/store-category-access.service';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryCacheService } from '../inventory/inventory-cache.service';
import { ListProductsDto } from './dto/list-products.dto';
type VariantWithInventory = ProductVariant & {
    inventory: Inventory | null;
};
type ProductWithRelations = Product & {
    variants: VariantWithInventory[];
    category: {
        id: string;
        name: string;
        slug: string;
    } | null;
};
export declare class ProductService {
    private readonly prisma;
    private readonly merchantService;
    private readonly audit;
    private readonly domainEvents;
    private readonly storeCategoryAccess;
    private readonly inventoryService;
    private readonly inventoryCache;
    private readonly logger;
    constructor(prisma: PrismaService, merchantService: MerchantService, audit: AuditService, domainEvents: DomainEventsService, storeCategoryAccess: StoreCategoryAccessService, inventoryService: InventoryService, inventoryCache: InventoryCacheService);
    createProduct(userId: string, storeId: string, dto: CreateProductDto, ipAddress?: string): Promise<ProductWithRelations>;
    listProducts(userId: string, storeId: string, dto: ListProductsDto): Promise<{
        products: ProductWithRelations[];
        total: number;
    }>;
    getProduct(userId: string, storeId: string, productId: string): Promise<ProductWithRelations>;
    updateProduct(userId: string, storeId: string, productId: string, dto: UpdateProductDto, ipAddress?: string): Promise<ProductWithRelations>;
    deleteProduct(userId: string, storeId: string, productId: string, ipAddress?: string): Promise<void>;
    updateInventory(userId: string, storeId: string, productId: string, variantId: string, dto: UpdateInventoryDto, ipAddress?: string): Promise<Inventory>;
    updatePrice(userId: string, storeId: string, productId: string, variantId: string, dto: UpdatePriceDto, ipAddress?: string): Promise<ProductVariant>;
    updateStatus(userId: string, storeId: string, productId: string, dto: UpdateProductStatusDto, ipAddress?: string): Promise<{
        id: string;
        isActive: boolean;
    }>;
    resolveDefaultVariantId(productId: string): Promise<string>;
    fetchProductWithRelations(productId: string, storeId?: string): Promise<ProductWithRelations>;
    private validateProductTaxCompliance;
    findStoreFssaiLicense(storeId: string): Promise<string | null>;
    private assertStoreOwnership;
    private assertSkuUnique;
    private assertVariantSkuUnique;
    private assertVariantBelongsToProduct;
    private validateProductCategory;
    private generateUniqueProductSlug;
}
export {};
