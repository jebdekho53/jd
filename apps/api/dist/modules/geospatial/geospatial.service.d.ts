import { Prisma } from '@prisma/client';
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
        nearestStores: {
            id: string;
            name: string;
            slug: string;
            logoUrl: string | null;
            distanceKm: number | null;
            ratingAvg: number;
            deliveryRadiusKm: number;
            etaMins: number | null;
        }[];
    }>;
    findNearestStores(lat: number, lng: number, limit?: number, excludeStoreId?: string): Promise<{
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
        distanceKm: number | null;
        ratingAvg: number;
        deliveryRadiusKm: number;
        etaMins: number | null;
    }[]>;
    getMapStores(lat: number, lng: number, radiusKm?: number): Promise<{
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
        lat: number;
        lng: number;
        distanceKm: number | null;
        ratingAvg: number;
        ratingCount: number;
        deliveryRadiusKm: number;
        locality: string | null;
        city: string;
        categories: string[];
        offer: {
            id: string;
            name: string;
            offerType: import("@prisma/client").$Enums.PromotionOfferType;
        };
        etaMins: number | null;
    }[]>;
    validateCheckoutLocation(storeId: string, lat: number, lng: number, buyerPincode?: string): Promise<void>;
    updateStoreRadius(adminUserId: string, storeId: string, dto: UpdateStoreRadiusDto): Promise<{
        updatedBy: string;
        id: string;
        name: string;
        latitude: number;
        longitude: number;
        slug: string;
        locality: string | null;
        deliveryRadiusKm: number;
    }>;
    listAddresses(userId: string): Promise<{
        id: string;
        label: import("@prisma/client").$Enums.AddressLabel;
        line1: string;
        line2: string | null;
        landmark: string | null;
        city: string;
        state: string;
        pincode: string;
        latitude: number;
        longitude: number;
        isDefault: boolean;
    }[]>;
    createAddress(userId: string, dto: CreateAddressDto): Promise<{
        id: string;
        label: import("@prisma/client").$Enums.AddressLabel;
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
        label: import("@prisma/client").$Enums.AddressLabel;
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
        fleet: {
            riders: {
                id: string;
                name: string;
                phone: string;
                status: string;
                vehicleType: import("@prisma/client").$Enums.VehicleType;
                zone: string;
                location: {
                    lat: number;
                    lng: number;
                    heading: number | null;
                    speed: number | null;
                    lastLocationAt: string | null;
                } | null;
                currentDelivery: {
                    orderId: string;
                    orderNumber: string;
                    status: import("@prisma/client").$Enums.DeliveryStatus;
                    etaMins: number | null;
                } | null;
            }[];
            stats: {
                onlineRiders: number;
                busyRiders: number;
                offlineRiders: number;
                activeOrders: number;
                unassignedOrders: number;
            };
            updatedAt: string;
        };
        stores: {
            deliveryRadiusKm: number;
            city: {
                name: string;
            };
            id: string;
            name: string;
            latitude: number;
            longitude: number;
            slug: string;
            locality: string | null;
        }[];
        zones: {
            city: {
                name: string;
            };
            id: string;
            name: string;
            centerLat: number;
            centerLng: number;
            radiusKm: number;
        }[];
        franchiseTerritories: {
            color: string;
            city: string;
            id: string;
            state: string;
            pincodes: string[];
            exclusivityEnabled: boolean;
            franchise: {
                id: string;
                businessName: string;
            };
        }[];
        riderClusters: {
            color: string;
            city: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            locality: string;
            activeRiders: number;
            activeOrders: number;
            demandSupplyRatio: number;
        }[];
        demandHotspots: {
            color: string;
            category: {
                name: string;
            } | null;
            city: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string | null;
            locality: string;
            demandScore: number;
        }[];
        batchRoutes: {
            id: string;
            riderName: string;
            status: import("@prisma/client").$Enums.DeliveryBatchStatus;
            orders: string[];
        }[];
        fleetAlerts: {
            city: string | null;
            message: string;
            id: string;
            status: import("@prisma/client").$Enums.FleetAlertStatus;
            metadata: Prisma.JsonValue | null;
            createdAt: Date;
            resolvedAt: Date | null;
            alertType: import("@prisma/client").$Enums.FleetAlertType;
            riderProfileId: string | null;
            locality: string | null;
        }[];
        unassignedOrders: {
            store: {
                id: string;
                name: string;
                latitude: number;
                longitude: number;
            };
            id: string;
            deliveryLat: number;
            deliveryLng: number;
            orderNumber: string;
        }[];
        activeDeliveries: {
            riderId: string;
            riderName: string;
            order: {
                orderId: string;
                orderNumber: string;
                status: import("@prisma/client").$Enums.DeliveryStatus;
                etaMins: number | null;
            } | null;
            lat: number;
            lng: number;
        }[];
        updatedAt: string;
    }>;
    getHotspotAnalytics(): Promise<{
        totalDelivered: number;
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
        deliveryDensity: number;
    }>;
    getMerchantAreaAnalytics(userId: string, storeId: string): Promise<{
        storeId: string;
        storeName: string;
        topDeliveryAreas: {
            areaKey: string;
            orderCount: number;
            revenue: number;
            repeatBuyers: number;
        }[];
        totalOrders: number;
    }>;
    private serializeAddress;
    private requireBuyerProfile;
    private assertStoreOwned;
}
