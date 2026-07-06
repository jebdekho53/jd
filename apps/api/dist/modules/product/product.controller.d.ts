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
        data: Category[];
    }>;
    createCategory(user: RequestUser, storeId: string, dto: CreateCategoryDto): Promise<{
        success: boolean;
        data: Category;
    }>;
    updateCategory(user: RequestUser, storeId: string, categoryId: string, dto: UpdateCategoryDto): Promise<{
        success: boolean;
        data: Category;
    }>;
    createProduct(user: RequestUser, storeId: string, dto: CreateProductDto, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
    listProducts(user: RequestUser, storeId: string, query: ListProductsDto): Promise<{
        success: boolean;
        data: any[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getProduct(user: RequestUser, storeId: string, productId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    updateProduct(user: RequestUser, storeId: string, productId: string, dto: UpdateProductDto, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
    deleteProduct(user: RequestUser, storeId: string, productId: string, ip: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    updateInventory(user: RequestUser, storeId: string, productId: string, variantId: string | undefined, dto: UpdateInventoryDto, ip: string): Promise<{
        success: boolean;
        data: Inventory;
    }>;
    updatePrice(user: RequestUser, storeId: string, productId: string, variantId: string | undefined, dto: UpdatePriceDto, ip: string): Promise<{
        success: boolean;
        data: ProductVariant;
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
