import { PrismaService } from '../../database/prisma.service';
import { LocationDirectoryService } from '../location-directory/location-directory.service';
import { MerchantService } from '../merchant/merchant.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { AddDeliveryAreaDto, AdminCoverageSearchDto, BulkAddDeliveryAreasDto, CsvImportRowDto, ListDeliveryAreasDto, UpdateDeliveryAreaDto } from './dto/delivery-coverage.dto';
export declare class DeliveryCoverageService {
    private readonly prisma;
    private readonly locations;
    private readonly merchantService;
    private readonly buyerCache;
    constructor(prisma: PrismaService, locations: LocationDirectoryService, merchantService: MerchantService, buyerCache: BuyerCacheService);
    getMaxAreasPerStore(): Promise<number>;
    private assertStoreOwnership;
    private resolvePincodeMeta;
    private serializeArea;
    listForStore(userId: string, storeId: string, dto: ListDeliveryAreasDto): Promise<{
        items: any;
        total: any;
        coverageCount: any;
        maxAreas: any;
    }>;
    addArea(userId: string, storeId: string, dto: AddDeliveryAreaDto): Promise<{
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
    }>;
    private addAreaForStore;
    bulkAdd(userId: string, storeId: string, dto: BulkAddDeliveryAreasDto): Promise<{
        added: number;
        skipped: number;
        errors: string[];
    }>;
    updateArea(userId: string, storeId: string, areaId: string, dto: UpdateDeliveryAreaDto): Promise<{
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
    }>;
    removeArea(userId: string, storeId: string, areaId: string): Promise<{
        deleted: boolean;
    }>;
    parseCsv(content: string): CsvImportRowDto[];
    importCsv(userId: string, storeId: string, csvContent: string): Promise<{
        added: number;
        skipped: number;
        errors: string[];
        total: number;
    }>;
    adminImportCsv(storeId: string, csvContent: string): Promise<{
        added: number;
        skipped: number;
        errors: string[];
        total: number;
    }>;
    private importCsvForStore;
    exportCsv(userId: string, storeId: string): Promise<string>;
    seedFromPincodes(storeId: string, pincodes: string[], defaults?: {
        deliveryFee?: number;
        minimumOrder?: number;
        estimatedMinutes?: number;
    }): Promise<void>;
    getMerchantAnalytics(userId: string, storeId: string): Promise<{
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
    }>;
    getAdminOverview(): Promise<{
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
    }>;
    adminSearchCoverage(dto: AdminCoverageSearchDto): Promise<{
        items: any;
        total: any;
    }>;
    adminSetPincodeActive(pincode: string, isActive: boolean, adminUserId: string): Promise<{
        pincode: string;
        isActive: boolean;
        updatedBy: string;
        records: any;
    }>;
    findStoreIdsForPincode(pincode: string): Promise<string[]>;
    private invalidateStoreCaches;
}
