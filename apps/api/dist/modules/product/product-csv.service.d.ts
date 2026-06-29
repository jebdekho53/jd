import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { ProductDuplicateService } from './product-duplicate.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductCsvRawRow } from './product-csv.util';
export interface ValidatedCsvRow {
    rowNumber: number;
    valid: boolean;
    errors: string[];
    warnings: string[];
    preview: Record<string, unknown>;
    dto?: CreateProductDto;
}
export declare class ProductCsvService {
    private readonly prisma;
    private readonly merchantService;
    private readonly categoryService;
    private readonly productService;
    private readonly duplicateService;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, merchantService: MerchantService, categoryService: CategoryService, productService: ProductService, duplicateService: ProductDuplicateService, configService: ConfigService);
    getTemplate(): string;
    validateCsv(userId: string, storeId: string, csvContent: string): Promise<{
        total: number;
        validCount: number;
        invalidCount: number;
        warningCount: number;
        rows: {
            rowNumber: number;
            valid: boolean;
            errors: string[];
            warnings: string[];
            preview: Record<string, unknown>;
        }[];
        errorCsv: string | undefined;
    }>;
    importCsv(userId: string, storeId: string, csvContent: string, rowNumbers: number[], ipAddress?: string): Promise<{
        imported: number;
        failed: number;
        created: {
            rowNumber: number;
            productId: string;
            name: string;
            warnings: string[];
        }[];
        errors: {
            rowNumber: number;
            error: string;
        }[];
    }>;
    buildErrorReport(csvContent: string, validated: ValidatedCsvRow[]): string;
    validateRows(userId: string, storeId: string, rows: ProductCsvRawRow[]): Promise<ValidatedCsvRow[]>;
    private resolveImageUrl;
    private buildCategoryMap;
    private categoryKey;
    private normalizeName;
    private parseNumber;
    private parseBoolean;
    private assertStoreOwnership;
}
