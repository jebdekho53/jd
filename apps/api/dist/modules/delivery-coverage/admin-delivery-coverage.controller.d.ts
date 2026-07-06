import { RequestUser } from '../../common/types';
import { DeliveryCoverageService } from './delivery-coverage.service';
import { AdminCoverageSearchDto } from './dto/delivery-coverage.dto';
export declare class AdminDeliveryCoverageController {
    private readonly coverage;
    constructor(coverage: DeliveryCoverageService);
    overview(): Promise<{
        success: boolean;
        data: {
            totalCoverageRows: any;
            activeCoverageRows: any;
            activeStores: any;
            masterPincodes: any;
            activeMasterPincodes: any;
            servedPincodeCount: any;
            coveragePercent: number;
            unservedPincodeCount: number;
            topCoveredAreas: any;
            leastCoveredAreas: any;
        };
    }>;
    search(query: AdminCoverageSearchDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
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
            records: any;
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
