import { RequestUser } from '../../common/types';
import { ProductCsvService } from './product-csv.service';
import { ProductCsvBodyDto, ProductCsvImportDto } from './dto/product-csv.dto';
export declare class ProductCsvController {
    private readonly csvService;
    constructor(csvService: ProductCsvService);
    getTemplate(): string;
    validate(user: RequestUser, storeId: string, body: ProductCsvBodyDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    importCsv(user: RequestUser, storeId: string, body: ProductCsvImportDto, ip: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
