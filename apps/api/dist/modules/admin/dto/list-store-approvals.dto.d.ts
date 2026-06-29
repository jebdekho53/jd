import { StoreStatus } from '@prisma/client';
export declare class ListStoreApprovalsDto {
    status?: StoreStatus;
    blacklisted?: boolean;
    cityId?: string;
    page?: number;
    limit?: number;
}
