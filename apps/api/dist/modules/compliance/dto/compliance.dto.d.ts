import { GstSlab } from '@prisma/client';
export declare class ListComplianceQueryDto {
    page?: number;
    limit?: number;
    month?: string;
}
export declare class ExportComplianceQueryDto extends ListComplianceQueryDto {
    format?: 'csv' | 'pdf';
}
export declare class UpdateProductTaxDto {
    hsnCodeId?: string;
    gstSlab?: GstSlab;
    taxCategory?: 'GOODS' | 'SERVICES' | 'EXEMPT' | 'NIL_RATED';
    taxInclusive?: boolean;
}
export declare class EnsureHsnCodeDto {
    code: string;
    gstSlab: GstSlab;
    description?: string;
}
export declare class SyncTdsTcsDto {
    periodMonth: string;
}
