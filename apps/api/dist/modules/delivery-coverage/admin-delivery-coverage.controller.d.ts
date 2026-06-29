import { RequestUser } from '../../common/types';
import { DeliveryCoverageService } from './delivery-coverage.service';
import { AdminCoverageSearchDto } from './dto/delivery-coverage.dto';
export declare class AdminDeliveryCoverageController {
    private readonly coverage;
    constructor(coverage: DeliveryCoverageService);
    overview(): Promise<{
        success: boolean;
        data: {
            totalCoverageRows: number;
            activeCoverageRows: number;
            activeStores: number;
            masterPincodes: number;
            activeMasterPincodes: number;
            servedPincodeCount: number;
            coveragePercent: number;
            unservedPincodeCount: number;
            topCoveredAreas: {
                pincode: string;
                storeCount: number;
            }[];
            leastCoveredAreas: {
                pincode: string;
                storeCount: number;
            }[];
        };
    }>;
    search(query: AdminCoverageSearchDto): Promise<{
        success: boolean;
        data: {
            items: {
                store: {
                    id: string;
                    name: string;
                    slug: string;
                };
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
            }[];
            total: number;
        };
    }>;
    setPincodeActive(user: RequestUser, pincode: string, body: {
        isActive: boolean;
    }): Promise<{
        success: boolean;
        data: {
            pincode: string;
            isActive: boolean;
            updatedBy: string;
            records: number;
        };
    }>;
    adminImport(body: {
        storeId: string;
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
}
