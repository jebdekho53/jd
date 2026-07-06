import { PrismaService } from '../../database/prisma.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { DeliveryTrackingService } from '../delivery-tracking/delivery-tracking.service';
import { RiderClusteringService } from '../fleet-os/rider-clustering.service';
import { BatchingService } from '../fleet-os/batching.service';
import { FleetAlertService } from '../fleet-os/fleet-alert.service';
import { HotspotService } from '../ai-commerce/hotspot.service';
import { LocationDirectoryService } from '../location-directory/location-directory.service';
import { CheckDeliverabilityDto, CreateAddressDto, UpdateAddressDto, UpdateStoreRadiusDto } from './dto/geospatial.dto';
export declare class GeospatialService {
    private readonly prisma;
    private readonly buyerCache;
    private readonly tracking;
    private readonly clusters;
    private readonly batching;
    private readonly fleetAlerts;
    private readonly hotspots;
    private readonly locations;
    constructor(prisma: PrismaService, buyerCache: BuyerCacheService, tracking: DeliveryTrackingService, clusters: RiderClusteringService, batching: BatchingService, fleetAlerts: FleetAlertService, hotspots: HotspotService, locations: LocationDirectoryService);
    checkDeliverability(dto: CheckDeliverabilityDto): Promise<{
        deliverable: boolean;
        distanceKm: number | null;
        deliveryRadiusKm: number;
        etaMins: number | null;
        reason: string | undefined;
        nearestStores: any;
    }>;
    findNearestStores(lat: number, lng: number, limit?: number, excludeStoreId?: string): Promise<any>;
    getMapStores(lat: number, lng: number, radiusKm?: number): Promise<any>;
    validateCheckoutLocation(storeId: string, lat: number, lng: number, buyerPincode?: string): Promise<void>;
    updateStoreRadius(adminUserId: string, storeId: string, dto: UpdateStoreRadiusDto): Promise<any>;
    listAddresses(userId: string): Promise<any>;
    createAddress(userId: string, dto: CreateAddressDto): Promise<{
        id: string;
        label: AddressLabel;
        line1: string;
        line2: string | null;
        landmark: string | null;
        city: string;
        state: string;
        pincode: string;
        latitude: number;
        longitude: number;
        isDefault: boolean;
    }>;
    updateAddress(userId: string, id: string, dto: UpdateAddressDto): Promise<{
        id: string;
        label: AddressLabel;
        line1: string;
        line2: string | null;
        landmark: string | null;
        city: string;
        state: string;
        pincode: string;
        latitude: number;
        longitude: number;
        isDefault: boolean;
    }>;
    deleteAddress(userId: string, id: string): Promise<{
        deleted: boolean;
    }>;
    getOperationsMap(): Promise<{
        fleet: any;
        stores: any;
        zones: any;
        franchiseTerritories: any;
        riderClusters: any;
        demandHotspots: any;
        batchRoutes: any;
        fleetAlerts: any;
        unassignedOrders: any;
        activeDeliveries: any;
        updatedAt: any;
    }>;
    getHotspotAnalytics(): Promise<{
        totalDelivered: any;
        topLocalities: {
            count: number;
            revenue: number;
            name: string;
        }[];
        topCities: {
            name: string;
            count: number;
        }[];
        peakHours: {
            hour: number;
            count: number;
        }[];
        deliveryDensity: any;
    }>;
    getMerchantAreaAnalytics(userId: string, storeId: string): Promise<{
        storeId: any;
        storeName: any;
        topDeliveryAreas: {
            areaKey: string;
            orderCount: number;
            revenue: number;
            repeatBuyers: number;
        }[];
        totalOrders: any;
    }>;
    private serializeAddress;
    private requireBuyerProfile;
    private assertStoreOwned;
}
