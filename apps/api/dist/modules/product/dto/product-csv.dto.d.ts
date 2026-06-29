export declare class ProductCsvBodyDto {
    csv: string;
}
export declare class ProductCsvImportDto extends ProductCsvBodyDto {
    rowNumbers: number[];
}
export declare class ProductCsvValidateRowDto {
    rowNumber: number;
    valid: boolean;
    errors: string[];
    preview: Record<string, unknown>;
}
