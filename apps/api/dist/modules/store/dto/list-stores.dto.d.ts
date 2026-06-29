import { StoreStatus } from '@prisma/client';
export declare class ListStoresDto {
    status?: StoreStatus;
    page?: number;
    limit?: number;
}
