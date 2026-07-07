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
        items: {
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
        coverageCount: number;
        maxAreas: number;
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
        coverageCount: number;
        reachPincodes: number;
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
    }>;
    adminSearchCoverage(dto: AdminCoverageSearchDto): Promise<{
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
    }>;
    adminSetPincodeActive(pincode: string, isActive: boolean, adminUserId: string): Promise<{
        pincode: string;
        isActive: boolean;
        updatedBy: string;
        records: number;
    }>;
    findStoreIdsForPincode(pincode: string): Promise<string[]>;
    private invalidateStoreCaches;
}
