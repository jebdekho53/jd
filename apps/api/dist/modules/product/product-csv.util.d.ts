export declare const PRODUCT_CSV_HEADERS: readonly ["name", "brand", "category", "subcategory", "sku", "unit", "mrp", "sellingPrice", "stock", "description", "tags", "hsnCode", "gstSlab", "fssaiLicense", "ingredients", "shelfLife", "countryOfOrigin", "manufacturerName", "storageInstructions", "imageUrl", "isActive"];
export type ProductCsvHeader = (typeof PRODUCT_CSV_HEADERS)[number];
export interface ProductCsvRawRow {
    rowNumber: number;
    values: Record<ProductCsvHeader, string>;
}
export declare function isValidImageUrl(url: string): boolean;
export declare function parseCsvLine(line: string): string[];
export declare function parseProductCsv(content: string): ProductCsvRawRow[];
export declare function buildProductCsvTemplate(): string;
export declare function buildErrorCsv(rows: {
    rowNumber: number;
    values: Record<string, string>;
    errors: string[];
}[]): string;
