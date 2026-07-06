import { RequestUser } from '../../common/types/index';
import { GeospatialService } from './geospatial.service';
import { CheckDeliverabilityDto, CreateAddressDto, MapStoresQueryDto, UpdateAddressDto } from './dto/geospatial.dto';
export declare class BuyerGeospatialController {
    private readonly geo;
    constructor(geo: GeospatialService);
    mapStores(dto: MapStoresQueryDto): Promise<{
        success: boolean;
        data: any;
    }>;
    deliverability(dto: CheckDeliverabilityDto): Promise<{
        success: boolean;
        data: {
            deliverable: boolean;
            distanceKm: number | null;
            deliveryRadiusKm: number;
            etaMins: number | null;
            reason: string | undefined;
            nearestStores: any;
        };
    }>;
    listAddresses(user: RequestUser): Promise<{
        success: boolean;
        data: any;
    }>;
    createAddress(user: RequestUser, dto: CreateAddressDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    updateAddress(user: RequestUser, id: string, dto: UpdateAddressDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    deleteAddress(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: {
            deleted: boolean;
        };
    }>;
}
export declare class AdminGeospatialController {
    private readonly geo;
    constructor(geo: GeospatialService);
    allowedRadii(): {
        success: boolean;
        data: readonly [1, 3, 5, 8, 10];
    };
    operationsMap(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    hotspots(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
export declare class MerchantGeospatialController {
    private readonly geo;
    constructor(geo: GeospatialService);
    areaAnalytics(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: {
            storeId: any;
            storeName: any;
            topDeliveryAreas: {
                areaKey: string;
                orderCount: number;
                revenue: number;
                repeatBuyers: number;
            }[];
            totalOrders: any;
        };
    }>;
}
