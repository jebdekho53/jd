import { RequestUser } from '../../common/types';
import { DeliveryCoverageService } from './delivery-coverage.service';
import { AddDeliveryAreaDto, BulkAddDeliveryAreasDto, ListDeliveryAreasDto, UpdateDeliveryAreaDto } from './dto/delivery-coverage.dto';
export declare class MerchantDeliveryCoverageController {
    private readonly coverage;
    constructor(coverage: DeliveryCoverageService);
    list(user: RequestUser, storeId: string, query: ListDeliveryAreasDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            coverageCount: any;
            maxAreas: any;
        };
    }>;
    analytics(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: {
            coverageCount: any;
            reachPincodes: any;
            topPincodes: {
                pincode: string;
                orders: number;
                revenue: number;
            }[];
            lowestPerformingPincodes: {
                pincode: string;
                orders: number;
                revenue: number;
            }[];
            ordersByPincode: {
                pincode: string;
                orders: number;
                revenue: number;
            }[];
        };
    }>;
    export(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: {
            csv: string;
        };
    }>;
    add(user: RequestUser, storeId: string, dto: AddDeliveryAreaDto): Promise<{
        success: boolean;
        data: {
            id: string;
            pincode: string;
            city: string | null;
            state: string | null;
            deliveryFee: number | null;
            minimumOrder: number | null;
            estimatedMinutes: number | null;
            priority: number;
            isActive: boolean;
            createdAt: string;
            updatedAt: string;
        };
    }>;
    bulkAdd(user: RequestUser, storeId: string, dto: BulkAddDeliveryAreasDto): Promise<{
        success: boolean;
        data: {
            added: number;
            skipped: number;
            errors: string[];
        };
    }>;
    importCsv(user: RequestUser, storeId: string, body: {
        csv: string;
    }): Promise<{
        success: boolean;
        data: {
            added: number;
            skipped: number;
            errors: string[];
            total: number;
        };
    }>;
    update(user: RequestUser, storeId: string, areaId: string, dto: UpdateDeliveryAreaDto): Promise<{
        success: boolean;
        data: {
            id: string;
            pincode: string;
            city: string | null;
            state: string | null;
            deliveryFee: number | null;
            minimumOrder: number | null;
            estimatedMinutes: number | null;
            priority: number;
            isActive: boolean;
            createdAt: string;
            updatedAt: string;
        };
    }>;
    remove(user: RequestUser, storeId: string, areaId: string): Promise<{
        success: boolean;
        data: {
            deleted: boolean;
        };
    }>;
}
