import { RequestUser } from '../../common/types/index';
import { GeospatialService } from './geospatial.service';
import { CheckDeliverabilityDto, CreateAddressDto, MapStoresQueryDto, UpdateAddressDto } from './dto/geospatial.dto';
export declare class BuyerGeospatialController {
    private readonly geo;
    constructor(geo: GeospatialService);
    mapStores(dto: MapStoresQueryDto): Promise<{
        success: boolean;
        data: {
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
        }[];
    }>;
    deliverability(dto: CheckDeliverabilityDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    listAddresses(user: RequestUser): Promise<{
        success: boolean;
        data: {
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
        }[];
    }>;
    createAddress(user: RequestUser, dto: CreateAddressDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    updateAddress(user: RequestUser, id: string, dto: UpdateAddressDto): Promise<{
        success: boolean;
        data: {
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
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
        };
    }>;
    hotspots(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
export declare class MerchantGeospatialController {
    private readonly geo;
    constructor(geo: GeospatialService);
    areaAnalytics(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: {
            storeId: string;
            storeName: string;
            topDeliveryAreas: {
                areaKey: string;
                orderCount: number;
                revenue: number;
                repeatBuyers: number;
            }[];
            totalOrders: number;
        };
    }>;
}
