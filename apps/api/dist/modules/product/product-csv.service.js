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
var ProductCsvService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductCsvService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const merchant_service_1 = require("../merchant/merchant.service");
const category_service_1 = require("./category.service");
const product_service_1 = require("./product.service");
const product_duplicate_service_1 = require("./product-duplicate.service");
const product_csv_util_1 = require("./product-csv.util");
const product_ai_constants_1 = require("./product-ai.constants");
const hsn_code_util_1 = require("./hsn-code.util");
const GST_SLAB_MAP = {
    ZERO: client_1.GstSlab.ZERO,
    '0': client_1.GstSlab.ZERO,
    FIVE: client_1.GstSlab.FIVE,
    '5': client_1.GstSlab.FIVE,
    TWELVE: client_1.GstSlab.TWELVE,
    '12': client_1.GstSlab.TWELVE,
    EIGHTEEN: client_1.GstSlab.EIGHTEEN,
    '18': client_1.GstSlab.EIGHTEEN,
    TWENTY_EIGHT: client_1.GstSlab.TWENTY_EIGHT,
    '28': client_1.GstSlab.TWENTY_EIGHT,
};
let ProductCsvService = ProductCsvService_1 = class ProductCsvService {
    constructor(prisma, merchantService, categoryService, productService, duplicateService, configService) {
        this.prisma = prisma;
        this.merchantService = merchantService;
        this.categoryService = categoryService;
        this.productService = productService;
        this.duplicateService = duplicateService;
        this.configService = configService;
        this.logger = new common_1.Logger(ProductCsvService_1.name);
    }
    getTemplate() {
        return (0, product_csv_util_1.buildProductCsvTemplate)();
    }
    async validateCsv(userId, storeId, csvContent) {
        await this.assertStoreOwnership(userId, storeId);
        const rows = (0, product_csv_util_1.parseProductCsv)(csvContent);
        if (rows.length === 0) {
            throw new common_1.BadRequestException('CSV file is empty or has no data rows');
        }
        const validated = await this.validateRows(userId, storeId, rows);
        const validCount = validated.filter((r) => r.valid).length;
        const invalidCount = validated.length - validCount;
        const warningCount = validated.filter((r) => r.warnings.length > 0).length;
        let errorCsv;
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
    async importCsv(userId, storeId, csvContent, rowNumbers, ipAddress) {
        await this.assertStoreOwnership(userId, storeId);
        const rows = (0, product_csv_util_1.parseProductCsv)(csvContent);
        const validated = await this.validateRows(userId, storeId, rows);
        const selected = new Set(rowNumbers);
        const toImport = validated.filter((r) => r.valid && selected.has(r.rowNumber));
        if (toImport.length === 0) {
            throw new common_1.BadRequestException('No valid rows selected for import');
        }
        const created = [];
        const failed = [];
        for (const row of toImport) {
            if (!row.dto)
                continue;
            try {
                const product = await this.productService.createProduct(userId, storeId, row.dto, ipAddress);
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
            }
            catch (e) {
                failed.push({ rowNumber: row.rowNumber, error: e.message });
            }
        }
        return {
            imported: created.length,
            failed: failed.length,
            created,
            errors: failed,
        };
    }
    buildErrorReport(csvContent, validated) {
        const rows = (0, product_csv_util_1.parseProductCsv)(csvContent);
        const invalid = validated.filter((r) => !r.valid);
        const errorRows = invalid.map((v) => {
            const raw = rows.find((r) => r.rowNumber === v.rowNumber);
            return {
                rowNumber: v.rowNumber,
                values: raw?.values ?? {},
                errors: v.errors,
            };
        });
        return (0, product_csv_util_1.buildErrorCsv)(errorRows);
    }
    async validateRows(userId, storeId, rows) {
        const categories = await this.categoryService.listCategories(storeId, userId);
        const categoryMap = this.buildCategoryMap(categories);
        const productIndex = await this.duplicateService.loadStoreProductIndex(storeId);
        const seenSkus = new Set();
        const seenIdentities = new Set();
        const results = [];
        for (const row of rows) {
            const errors = [];
            const warnings = [];
            const v = row.values;
            if (!v.name?.trim())
                errors.push('name is required');
            if (v.name && v.name.length > 200)
                errors.push('name must be at most 200 characters');
            const sellingPrice = this.parseNumber(v.sellingPrice, 'sellingPrice', errors, true);
            const mrp = this.parseNumber(v.mrp, 'mrp', errors, false);
            const stock = this.parseNumber(v.stock, 'stock', errors, false) ?? 0;
            if (sellingPrice !== undefined && mrp !== undefined && sellingPrice > mrp) {
                errors.push('sellingPrice cannot exceed mrp');
            }
            let categoryId;
            if (v.category?.trim()) {
                const key = this.categoryKey(v.category, v.subcategory);
                categoryId = categoryMap.get(key);
                if (!categoryId) {
                    errors.push(`category/subcategory "${v.category}${v.subcategory ? ` / ${v.subcategory}` : ''}" not found in approved store categories`);
                }
            }
            if (v.sku?.trim() && !/^[A-Za-z0-9_-]{2,50}$/.test(v.sku.trim())) {
                errors.push('sku must be 2-50 alphanumeric characters, dashes, or underscores');
            }
            if (v.imageUrl?.trim() && !(0, product_csv_util_1.isValidImageUrl)(v.imageUrl)) {
                errors.push('imageUrl must be a valid http(s) URL');
            }
            let hsnCodeId;
            const hsnCode = (0, hsn_code_util_1.normalizeHsnCode)(v.hsnCode);
            if (!hsnCode) {
                errors.push('hsnCode is required');
            }
            else if (!(0, hsn_code_util_1.isValidHsnCode)(hsnCode)) {
                errors.push('hsnCode must be numeric and 4, 6, or 8 digits');
            }
            else {
                const hsn = await this.prisma.hSNCode.findFirst({
                    where: { code: hsnCode, isActive: true },
                });
                if (!hsn)
                    errors.push(`hsnCode "${hsnCode}" not found`);
                else
                    hsnCodeId = hsn.id;
            }
            let gstSlab;
            if (v.gstSlab?.trim()) {
                gstSlab = GST_SLAB_MAP[v.gstSlab.trim().toUpperCase()];
                if (!gstSlab)
                    errors.push(`invalid gstSlab "${v.gstSlab}"`);
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
                if (dup)
                    errors.push(dup.message);
                if (sku) {
                    const skuKey = sku.toLowerCase();
                    if (seenSkus.has(skuKey)) {
                        errors.push(`Duplicate SKU "${sku}" within this CSV file`);
                    }
                    else {
                        seenSkus.add(skuKey);
                    }
                }
                const identityKey = this.duplicateService.identityKey(v.name.trim(), brand, unit);
                if (seenIdentities.has(identityKey)) {
                    errors.push('Duplicate name+brand+unit within this CSV file');
                }
                else {
                    seenIdentities.add(identityKey);
                }
            }
            const isActive = this.parseBoolean(v.isActive, true);
            const tags = v.tags
                ? v.tags.split(',').map((t) => t.trim()).filter(Boolean)
                : [];
            const { imageUrl, imageWarnings } = this.resolveImageUrl(v.imageUrl);
            warnings.push(...imageWarnings);
            const preview = {
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
                hsnCode,
                gstSlab: gstSlab ?? v.gstSlab?.trim(),
                fssaiLicense: v.fssaiLicense?.trim(),
                imageUrl: v.imageUrl?.trim() || undefined,
                resolvedImageUrl: imageUrl,
                imageMissingWarning: imageWarnings.length > 0,
                isActive,
            };
            let dto;
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
                    hsnCodeId: hsnCodeId,
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
    resolveImageUrl(rawImageUrl) {
        const warnings = [];
        if ((0, product_csv_util_1.isValidImageUrl)(rawImageUrl ?? '')) {
            return { imageUrl: rawImageUrl.trim(), imageWarnings: warnings };
        }
        const envPlaceholder = this.configService.get('PRODUCT_CSV_PLACEHOLDER_IMAGE_URL', '');
        if (envPlaceholder && (0, product_csv_util_1.isValidImageUrl)(envPlaceholder)) {
            warnings.push('imageUrl missing — using configured placeholder image');
            return { imageUrl: envPlaceholder.trim(), imageWarnings: warnings };
        }
        warnings.push('Product image missing — using default placeholder. Add imageUrl or set PRODUCT_CSV_PLACEHOLDER_IMAGE_URL');
        return { imageUrl: product_ai_constants_1.DEFAULT_MISSING_PRODUCT_IMAGE_URL, imageWarnings: warnings };
    }
    buildCategoryMap(categories) {
        const map = new Map();
        for (const parent of categories) {
            map.set(this.normalizeName(parent.name), parent.id);
            for (const child of parent.children ?? []) {
                map.set(this.categoryKey(parent.name, child.name), child.id);
                map.set(this.normalizeName(child.name), child.id);
            }
        }
        return map;
    }
    categoryKey(category, subcategory) {
        if (subcategory?.trim()) {
            return `${this.normalizeName(category)}::${this.normalizeName(subcategory)}`;
        }
        return this.normalizeName(category);
    }
    normalizeName(name) {
        return name.trim().toLowerCase();
    }
    parseNumber(raw, field, errors, required) {
        if (!raw?.trim()) {
            if (required)
                errors.push(`${field} is required`);
            return undefined;
        }
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 0) {
            errors.push(`${field} must be a non-negative number`);
            return undefined;
        }
        return n;
    }
    parseBoolean(raw, defaultValue) {
        if (!raw?.trim())
            return defaultValue;
        const v = raw.trim().toLowerCase();
        if (['true', '1', 'yes'].includes(v))
            return true;
        if (['false', '0', 'no'].includes(v))
            return false;
        return defaultValue;
    }
    async assertStoreOwnership(userId, storeId) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
        });
        if (!store)
            throw new common_1.ForbiddenException('Store not found or not owned by you');
    }
};
exports.ProductCsvService = ProductCsvService;
exports.ProductCsvService = ProductCsvService = ProductCsvService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        merchant_service_1.MerchantService,
        category_service_1.CategoryService,
        product_service_1.ProductService,
        product_duplicate_service_1.ProductDuplicateService,
        config_1.ConfigService])
], ProductCsvService);
//# sourceMappingURL=product-csv.service.js.map