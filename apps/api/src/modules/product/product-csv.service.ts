import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GstSlab } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { ProductDuplicateService } from './product-duplicate.service';
import { CreateProductDto } from './dto/create-product.dto';
import {
  buildErrorCsv,
  buildProductCsvTemplate,
  isValidImageUrl,
  parseProductCsv,
  ProductCsvRawRow,
} from './product-csv.util';
import { DEFAULT_MISSING_PRODUCT_IMAGE_URL } from './product-ai.constants';

export interface ValidatedCsvRow {
  rowNumber: number;
  valid: boolean;
  errors: string[];
  warnings: string[];
  preview: Record<string, unknown>;
  dto?: CreateProductDto;
}

const GST_SLAB_MAP: Record<string, GstSlab> = {
  ZERO: GstSlab.ZERO,
  '0': GstSlab.ZERO,
  FIVE: GstSlab.FIVE,
  '5': GstSlab.FIVE,
  TWELVE: GstSlab.TWELVE,
  '12': GstSlab.TWELVE,
  EIGHTEEN: GstSlab.EIGHTEEN,
  '18': GstSlab.EIGHTEEN,
  TWENTY_EIGHT: GstSlab.TWENTY_EIGHT,
  '28': GstSlab.TWENTY_EIGHT,
};

@Injectable()
export class ProductCsvService {
  private readonly logger = new Logger(ProductCsvService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService,
    private readonly duplicateService: ProductDuplicateService,
    private readonly configService: ConfigService,
  ) {}

  getTemplate(): string {
    return buildProductCsvTemplate();
  }

  async validateCsv(userId: string, storeId: string, csvContent: string) {
    await this.assertStoreOwnership(userId, storeId);
    const rows = parseProductCsv(csvContent);
    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty or has no data rows');
    }
    const validated = await this.validateRows(userId, storeId, rows);
    const validCount = validated.filter((r) => r.valid).length;
    const invalidCount = validated.length - validCount;
    const warningCount = validated.filter((r) => r.warnings.length > 0).length;
    let errorCsv: string | undefined;
    if (invalidCount > 0) {
      errorCsv = this.buildErrorReport(csvContent, validated);
    }
    return {
      total: validated.length,
      validCount,
      invalidCount,
      warningCount,
      rows: validated.map(({ rowNumber, valid, errors, warnings, preview }) => ({
        rowNumber,
        valid,
        errors,
        warnings,
        preview,
      })),
      errorCsv,
    };
  }

  async importCsv(
    userId: string,
    storeId: string,
    csvContent: string,
    rowNumbers: number[],
    ipAddress?: string,
  ) {
    await this.assertStoreOwnership(userId, storeId);
    const rows = parseProductCsv(csvContent);
    const validated = await this.validateRows(userId, storeId, rows);
    const selected = new Set(rowNumbers);
    const toImport = validated.filter((r) => r.valid && selected.has(r.rowNumber));

    if (toImport.length === 0) {
      throw new BadRequestException('No valid rows selected for import');
    }

    const created: { rowNumber: number; productId: string; name: string; warnings: string[] }[] = [];
    const failed: { rowNumber: number; error: string }[] = [];

    for (const row of toImport) {
      if (!row.dto) continue;
      try {
        const product = await this.productService.createProduct(
          userId,
          storeId,
          row.dto,
          ipAddress,
        );
        const isActive = row.preview.isActive !== false;
        if (!isActive) {
          await this.productService.updateStatus(userId, storeId, product.id, {
            isActive: false,
          });
        }
        created.push({
          rowNumber: row.rowNumber,
          productId: product.id,
          name: product.name,
          warnings: row.warnings,
        });
      } catch (e) {
        failed.push({ rowNumber: row.rowNumber, error: (e as Error).message });
      }
    }

    return {
      imported: created.length,
      failed: failed.length,
      created,
      errors: failed,
    };
  }

  buildErrorReport(csvContent: string, validated: ValidatedCsvRow[]): string {
    const rows = parseProductCsv(csvContent);
    const invalid = validated.filter((r) => !r.valid);
    const errorRows = invalid.map((v) => {
      const raw = rows.find((r) => r.rowNumber === v.rowNumber);
      return {
        rowNumber: v.rowNumber,
        values: raw?.values ?? ({} as Record<string, string>),
        errors: v.errors,
      };
    });
    return buildErrorCsv(errorRows);
  }

  async validateRows(
    userId: string,
    storeId: string,
    rows: ProductCsvRawRow[],
  ): Promise<ValidatedCsvRow[]> {
    const categories = await this.categoryService.listCategories(storeId, userId);
    const categoryMap = this.buildCategoryMap(categories);
    const productIndex = await this.duplicateService.loadStoreProductIndex(storeId);
    const seenSkus = new Set<string>();
    const seenIdentities = new Set<string>();

    const results: ValidatedCsvRow[] = [];
    for (const row of rows) {
      const errors: string[] = [];
      const warnings: string[] = [];
      const v = row.values;

      if (!v.name?.trim()) errors.push('name is required');
      if (v.name && v.name.length > 200) errors.push('name must be at most 200 characters');

      const sellingPrice = this.parseNumber(v.sellingPrice, 'sellingPrice', errors, true);
      const mrp = this.parseNumber(v.mrp, 'mrp', errors, false);
      const stock = this.parseNumber(v.stock, 'stock', errors, false) ?? 0;

      if (sellingPrice !== undefined && mrp !== undefined && sellingPrice > mrp) {
        errors.push('sellingPrice cannot exceed mrp');
      }

      let categoryId: string | undefined;
      if (v.category?.trim()) {
        const key = this.categoryKey(v.category, v.subcategory);
        categoryId = categoryMap.get(key);
        if (!categoryId) {
          errors.push(
            `category/subcategory "${v.category}${v.subcategory ? ` / ${v.subcategory}` : ''}" not found in approved store categories`,
          );
        }
      }

      if (v.sku?.trim() && !/^[A-Za-z0-9_-]{2,50}$/.test(v.sku.trim())) {
        errors.push('sku must be 2-50 alphanumeric characters, dashes, or underscores');
      }

      if (v.imageUrl?.trim() && !isValidImageUrl(v.imageUrl)) {
        errors.push('imageUrl must be a valid http(s) URL');
      }

      let hsnCodeId: string | undefined;
      if (v.hsnCode?.trim()) {
        const hsn = await this.prisma.hSNCode.findFirst({
          where: { code: v.hsnCode.trim(), isActive: true },
        });
        if (!hsn) errors.push(`hsnCode "${v.hsnCode}" not found`);
        else hsnCodeId = hsn.id;
      }

      let gstSlab: GstSlab | undefined;
      if (v.gstSlab?.trim()) {
        gstSlab = GST_SLAB_MAP[v.gstSlab.trim().toUpperCase()];
        if (!gstSlab) errors.push(`invalid gstSlab "${v.gstSlab}"`);
      }

      const unit = v.unit?.trim() || 'piece';
      const brand = v.brand?.trim();
      const sku = v.sku?.trim();

      if (errors.length === 0 && v.name?.trim()) {
        const dup = this.duplicateService.checkDuplicate(productIndex, {
          sku,
          name: v.name.trim(),
          brand,
          unit,
        });
        if (dup) errors.push(dup.message);

        if (sku) {
          const skuKey = sku.toLowerCase();
          if (seenSkus.has(skuKey)) {
            errors.push(`Duplicate SKU "${sku}" within this CSV file`);
          } else {
            seenSkus.add(skuKey);
          }
        }

        const identityKey = this.duplicateService.identityKey(v.name.trim(), brand, unit);
        if (seenIdentities.has(identityKey)) {
          errors.push('Duplicate name+brand+unit within this CSV file');
        } else {
          seenIdentities.add(identityKey);
        }
      }

      const isActive = this.parseBoolean(v.isActive, true);
      const tags = v.tags
        ? v.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const { imageUrl, imageWarnings } = this.resolveImageUrl(v.imageUrl);
      warnings.push(...imageWarnings);

      const preview: Record<string, unknown> = {
        name: v.name?.trim(),
        brand: brand || undefined,
        category: v.category?.trim(),
        subcategory: v.subcategory?.trim(),
        categoryId,
        sku: sku || undefined,
        unit,
        mrp,
        sellingPrice,
        stock,
        description: v.description?.trim(),
        tags,
        hsnCode: v.hsnCode?.trim(),
        gstSlab: gstSlab ?? v.gstSlab?.trim(),
        fssaiLicense: v.fssaiLicense?.trim(),
        imageUrl: v.imageUrl?.trim() || undefined,
        resolvedImageUrl: imageUrl,
        imageMissingWarning: imageWarnings.length > 0,
        isActive,
      };

      let dto: CreateProductDto | undefined;
      if (errors.length === 0 && sellingPrice !== undefined && imageUrl) {
        dto = {
          name: v.name.trim(),
          description: v.description?.trim(),
          brand,
          sku: sku || undefined,
          categoryId,
          imageUrls: [imageUrl],
          basePrice: sellingPrice,
          mrp,
          unit,
          quantity: stock,
          tags,
          ingredients: v.ingredients?.trim(),
          shelfLife: v.shelfLife?.trim(),
          countryOfOrigin: v.countryOfOrigin?.trim(),
          manufacturerName: v.manufacturerName?.trim(),
          fssaiLicense: v.fssaiLicense?.trim(),
          storageInstructions: v.storageInstructions?.trim(),
          hsnCodeId,
          gstSlab,
        };
      }

      results.push({
        rowNumber: row.rowNumber,
        valid: errors.length === 0,
        errors,
        warnings,
        preview,
        dto,
      });
    }
    return results;
  }

  private resolveImageUrl(rawImageUrl?: string): {
    imageUrl: string | null;
    imageWarnings: string[];
  } {
    const warnings: string[] = [];

    if (isValidImageUrl(rawImageUrl ?? '')) {
      return { imageUrl: rawImageUrl!.trim(), imageWarnings: warnings };
    }

    const envPlaceholder = this.configService.get<string>('PRODUCT_CSV_PLACEHOLDER_IMAGE_URL', '');
    if (envPlaceholder && isValidImageUrl(envPlaceholder)) {
      warnings.push('imageUrl missing — using configured placeholder image');
      return { imageUrl: envPlaceholder.trim(), imageWarnings: warnings };
    }

    warnings.push(
      'Product image missing — using default placeholder. Add imageUrl or set PRODUCT_CSV_PLACEHOLDER_IMAGE_URL',
    );
    return { imageUrl: DEFAULT_MISSING_PRODUCT_IMAGE_URL, imageWarnings: warnings };
  }

  private buildCategoryMap(
    categories: { id: string; name: string; children?: { id: string; name: string }[] }[],
  ): Map<string, string> {
    const map = new Map<string, string>();
    for (const parent of categories) {
      map.set(this.normalizeName(parent.name), parent.id);
      for (const child of parent.children ?? []) {
        map.set(this.categoryKey(parent.name, child.name), child.id);
        map.set(this.normalizeName(child.name), child.id);
      }
    }
    return map;
  }

  private categoryKey(category: string, subcategory?: string): string {
    if (subcategory?.trim()) {
      return `${this.normalizeName(category)}::${this.normalizeName(subcategory)}`;
    }
    return this.normalizeName(category);
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase();
  }

  private parseNumber(
    raw: string,
    field: string,
    errors: string[],
    required: boolean,
  ): number | undefined {
    if (!raw?.trim()) {
      if (required) errors.push(`${field} is required`);
      return undefined;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      errors.push(`${field} must be a non-negative number`);
      return undefined;
    }
    return n;
  }

  private parseBoolean(raw: string, defaultValue: boolean): boolean {
    if (!raw?.trim()) return defaultValue;
    const v = raw.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(v)) return true;
    if (['false', '0', 'no'].includes(v)) return false;
    return defaultValue;
  }

  private async assertStoreOwnership(userId: string, storeId: string): Promise<void> {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
    });
    if (!store) throw new ForbiddenException('Store not found or not owned by you');
  }
}
