import { RequestUser } from '../../common/types';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { UpdateProductStatusDto } from './dto/update-status.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
export declare class ProductController {
    private readonly productService;
    private readonly categoryService;
    constructor(productService: ProductService, categoryService: CategoryService);
    listCategories(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            storeId: string | null;
            scope: import("@prisma/client").$Enums.CategoryScope;
            isActive: boolean;
            slug: string;
            sortOrder: number;
            parentId: string | null;
            icon: string | null;
            imageUrl: string | null;
            catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
        }[];
    }>;
    createCategory(user: RequestUser, storeId: string, dto: CreateCategoryDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            storeId: string | null;
            scope: import("@prisma/client").$Enums.CategoryScope;
            isActive: boolean;
            slug: string;
            sortOrder: number;
            parentId: string | null;
            icon: string | null;
            imageUrl: string | null;
            catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
        };
    }>;
    updateCategory(user: RequestUser, storeId: string, categoryId: string, dto: UpdateCategoryDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            storeId: string | null;
            scope: import("@prisma/client").$Enums.CategoryScope;
            isActive: boolean;
            slug: string;
            sortOrder: number;
            parentId: string | null;
            icon: string | null;
            imageUrl: string | null;
            catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
        };
    }>;
    createProduct(user: RequestUser, storeId: string, dto: CreateProductDto, ip: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            storeId: string;
            categoryId: string | null;
            isActive: boolean;
            slug: string;
            sku: string | null;
            tags: string[];
            sortOrder: number;
            unit: string;
            brand: string | null;
            isReturnable: boolean;
            isRefundable: boolean;
            isReplaceable: boolean;
            returnWindowHours: number | null;
            approvalMode: import("@prisma/client").$Enums.ClaimApprovalMode;
            proofRequired: import("@prisma/client").$Enums.ClaimProofRequirement;
            autoApproveBelowAmount: import("@prisma/client/runtime/library").Decimal | null;
            returnReasons: import("@prisma/client").$Enums.ReturnClaimReason[];
            restockingFee: import("@prisma/client/runtime/library").Decimal;
            refundMethod: import("@prisma/client").$Enums.ClaimRefundMethod;
            returnPolicyText: string | null;
            replacementPolicyText: string | null;
            preparedFoodPolicy: import("@prisma/client").$Enums.PreparedFoodPolicy | null;
            allowCustomerChangedMind: boolean;
            imageUrls: string[];
            basePrice: import("@prisma/client/runtime/library").Decimal;
            mrp: import("@prisma/client/runtime/library").Decimal | null;
            weightGrams: number | null;
            isVeg: boolean | null;
            hsnCodeId: string | null;
            gstSlab: import("@prisma/client").$Enums.GstSlab | null;
            taxCategory: import("@prisma/client").$Enums.ProductTaxCategory;
            taxInclusive: boolean;
            ingredients: string | null;
            shelfLife: string | null;
            countryOfOrigin: string | null;
            manufacturerName: string | null;
            manufacturerAddress: string | null;
            fssaiLicense: string | null;
            storageInstructions: string | null;
            disclaimer: string | null;
        } & {
            variants: ({
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                productId: string;
                isActive: boolean;
                sku: string;
                mrp: import("@prisma/client/runtime/library").Decimal | null;
                weightGrams: number | null;
                isDefault: boolean;
                price: import("@prisma/client/runtime/library").Decimal;
            } & {
                inventory: import("@prisma/client").Inventory | null;
            })[];
            category: {
                id: string;
                name: string;
                slug: string;
            } | null;
        };
    }>;
    listProducts(user: RequestUser, storeId: string, query: ListProductsDto): Promise<{
        success: boolean;
        data: ({
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            storeId: string;
            categoryId: string | null;
            isActive: boolean;
            slug: string;
            sku: string | null;
            tags: string[];
            sortOrder: number;
            unit: string;
            brand: string | null;
            isReturnable: boolean;
            isRefundable: boolean;
            isReplaceable: boolean;
            returnWindowHours: number | null;
            approvalMode: import("@prisma/client").$Enums.ClaimApprovalMode;
            proofRequired: import("@prisma/client").$Enums.ClaimProofRequirement;
            autoApproveBelowAmount: import("@prisma/client/runtime/library").Decimal | null;
            returnReasons: import("@prisma/client").$Enums.ReturnClaimReason[];
            restockingFee: import("@prisma/client/runtime/library").Decimal;
            refundMethod: import("@prisma/client").$Enums.ClaimRefundMethod;
            returnPolicyText: string | null;
            replacementPolicyText: string | null;
            preparedFoodPolicy: import("@prisma/client").$Enums.PreparedFoodPolicy | null;
            allowCustomerChangedMind: boolean;
            imageUrls: string[];
            basePrice: import("@prisma/client/runtime/library").Decimal;
            mrp: import("@prisma/client/runtime/library").Decimal | null;
            weightGrams: number | null;
            isVeg: boolean | null;
            hsnCodeId: string | null;
            gstSlab: import("@prisma/client").$Enums.GstSlab | null;
            taxCategory: import("@prisma/client").$Enums.ProductTaxCategory;
            taxInclusive: boolean;
            ingredients: string | null;
            shelfLife: string | null;
            countryOfOrigin: string | null;
            manufacturerName: string | null;
            manufacturerAddress: string | null;
            fssaiLicense: string | null;
            storageInstructions: string | null;
            disclaimer: string | null;
        } & {
            variants: ({
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                productId: string;
                isActive: boolean;
                sku: string;
                mrp: import("@prisma/client/runtime/library").Decimal | null;
                weightGrams: number | null;
                isDefault: boolean;
                price: import("@prisma/client/runtime/library").Decimal;
            } & {
                inventory: import("@prisma/client").Inventory | null;
            })[];
            category: {
                id: string;
                name: string;
                slug: string;
            } | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getProduct(user: RequestUser, storeId: string, productId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            storeId: string;
            categoryId: string | null;
            isActive: boolean;
            slug: string;
            sku: string | null;
            tags: string[];
            sortOrder: number;
            unit: string;
            brand: string | null;
            isReturnable: boolean;
            isRefundable: boolean;
            isReplaceable: boolean;
            returnWindowHours: number | null;
            approvalMode: import("@prisma/client").$Enums.ClaimApprovalMode;
            proofRequired: import("@prisma/client").$Enums.ClaimProofRequirement;
            autoApproveBelowAmount: import("@prisma/client/runtime/library").Decimal | null;
            returnReasons: import("@prisma/client").$Enums.ReturnClaimReason[];
            restockingFee: import("@prisma/client/runtime/library").Decimal;
            refundMethod: import("@prisma/client").$Enums.ClaimRefundMethod;
            returnPolicyText: string | null;
            replacementPolicyText: string | null;
            preparedFoodPolicy: import("@prisma/client").$Enums.PreparedFoodPolicy | null;
            allowCustomerChangedMind: boolean;
            imageUrls: string[];
            basePrice: import("@prisma/client/runtime/library").Decimal;
            mrp: import("@prisma/client/runtime/library").Decimal | null;
            weightGrams: number | null;
            isVeg: boolean | null;
            hsnCodeId: string | null;
            gstSlab: import("@prisma/client").$Enums.GstSlab | null;
            taxCategory: import("@prisma/client").$Enums.ProductTaxCategory;
            taxInclusive: boolean;
            ingredients: string | null;
            shelfLife: string | null;
            countryOfOrigin: string | null;
            manufacturerName: string | null;
            manufacturerAddress: string | null;
            fssaiLicense: string | null;
            storageInstructions: string | null;
            disclaimer: string | null;
        } & {
            variants: ({
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                productId: string;
                isActive: boolean;
                sku: string;
                mrp: import("@prisma/client/runtime/library").Decimal | null;
                weightGrams: number | null;
                isDefault: boolean;
                price: import("@prisma/client/runtime/library").Decimal;
            } & {
                inventory: import("@prisma/client").Inventory | null;
            })[];
            category: {
                id: string;
                name: string;
                slug: string;
            } | null;
        };
    }>;
    updateProduct(user: RequestUser, storeId: string, productId: string, dto: UpdateProductDto, ip: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            storeId: string;
            categoryId: string | null;
            isActive: boolean;
            slug: string;
            sku: string | null;
            tags: string[];
            sortOrder: number;
            unit: string;
            brand: string | null;
            isReturnable: boolean;
            isRefundable: boolean;
            isReplaceable: boolean;
            returnWindowHours: number | null;
            approvalMode: import("@prisma/client").$Enums.ClaimApprovalMode;
            proofRequired: import("@prisma/client").$Enums.ClaimProofRequirement;
            autoApproveBelowAmount: import("@prisma/client/runtime/library").Decimal | null;
            returnReasons: import("@prisma/client").$Enums.ReturnClaimReason[];
            restockingFee: import("@prisma/client/runtime/library").Decimal;
            refundMethod: import("@prisma/client").$Enums.ClaimRefundMethod;
            returnPolicyText: string | null;
            replacementPolicyText: string | null;
            preparedFoodPolicy: import("@prisma/client").$Enums.PreparedFoodPolicy | null;
            allowCustomerChangedMind: boolean;
            imageUrls: string[];
            basePrice: import("@prisma/client/runtime/library").Decimal;
            mrp: import("@prisma/client/runtime/library").Decimal | null;
            weightGrams: number | null;
            isVeg: boolean | null;
            hsnCodeId: string | null;
            gstSlab: import("@prisma/client").$Enums.GstSlab | null;
            taxCategory: import("@prisma/client").$Enums.ProductTaxCategory;
            taxInclusive: boolean;
            ingredients: string | null;
            shelfLife: string | null;
            countryOfOrigin: string | null;
            manufacturerName: string | null;
            manufacturerAddress: string | null;
            fssaiLicense: string | null;
            storageInstructions: string | null;
            disclaimer: string | null;
        } & {
            variants: ({
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                productId: string;
                isActive: boolean;
                sku: string;
                mrp: import("@prisma/client/runtime/library").Decimal | null;
                weightGrams: number | null;
                isDefault: boolean;
                price: import("@prisma/client/runtime/library").Decimal;
            } & {
                inventory: import("@prisma/client").Inventory | null;
            })[];
            category: {
                id: string;
                name: string;
                slug: string;
            } | null;
        };
    }>;
    deleteProduct(user: RequestUser, storeId: string, productId: string, ip: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    updateInventory(user: RequestUser, storeId: string, productId: string, variantId: string | undefined, dto: UpdateInventoryDto, ip: string): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.InventoryStatus;
            updatedAt: Date;
            version: number;
            variantId: string;
            availableQty: number;
            reservedQty: number;
            soldQty: number;
            lowStockThreshold: number;
        };
    }>;
    updatePrice(user: RequestUser, storeId: string, productId: string, variantId: string | undefined, dto: UpdatePriceDto, ip: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            isActive: boolean;
            sku: string;
            mrp: import("@prisma/client/runtime/library").Decimal | null;
            weightGrams: number | null;
            isDefault: boolean;
            price: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
    updateStatus(user: RequestUser, storeId: string, productId: string, dto: UpdateProductStatusDto, ip: string): Promise<{
        success: boolean;
        data: {
            id: string;
            isActive: boolean;
        };
    }>;
    private resolveVariantId;
}
