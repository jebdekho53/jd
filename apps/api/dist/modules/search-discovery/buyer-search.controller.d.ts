import { RequestUser } from '../../common/types';
import { CartService } from '../cart/cart.service';
import { SearchDiscoveryService } from './search-discovery.service';
import { SearchAnalyticsService } from './search-analytics.service';
import { BuyerSearchDto, DiscoverHomeDto, DiscoverStoresSearchDto, SearchSuggestionsDto, SearchTrendingDto, TrackSearchEventDto } from './dto/search-discovery.dto';
export declare class BuyerSearchController {
    private readonly discovery;
    private readonly analytics;
    private readonly cartService;
    constructor(discovery: SearchDiscoveryService, analytics: SearchAnalyticsService, cartService: CartService);
    search(dto: BuyerSearchDto): Promise<{
        success: boolean;
        data: {
            products: never[];
            stores: never[];
            categories: never[];
            subcategories: never[];
            brands: never[];
            menuItems: never[];
            restaurants: never[];
            meta: {
                page: number;
                limit: number;
                totalProducts: number;
                totalPages: number;
                sort: string;
                tab: string;
            };
        } | {
            products: {
                id: string;
                name: string;
                slug: string;
                brand: string | null;
                imageUrls: string[];
                basePrice: number;
                mrp: number | null;
                variantId: string;
                category: {
                    id: string;
                    name: string;
                    slug: string;
                } | null;
                store: {
                    id: string;
                    name: string;
                    slug: string;
                    distanceKm: number | undefined;
                    ratingAvg: number;
                    avgPrepTimeMins: number;
                    etaMins: number;
                    hasOffer: boolean;
                };
                inStock: boolean;
                availableQty: number;
                score: number;
                sortPrice: number;
                sortEta: number;
                sortRating: number;
                sortDistance: number;
            }[];
            stores: {
                id: string;
                name: string;
                slug: string;
                logoUrl: string | null;
                bannerUrl: string | null;
                ratingAvg: number;
                distanceKm: number;
                etaMins: number;
                hasOffer: boolean;
                categories: {
                    id: string;
                    name: string;
                }[];
            }[];
            categories: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
                imageUrl: string | null;
            }[];
            subcategories: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
                imageUrl: string | null;
            }[];
            brands: {
                name: string;
            }[];
            menuItems: {
                id: string;
                name: string;
                basePrice: number;
                dietType: string;
                store: ({
                    hours: {
                        id: string;
                        storeId: string;
                        dayOfWeek: import("@prisma/client").$Enums.DayOfWeek;
                        openTime: string;
                        closeTime: string;
                        isClosed: boolean;
                    }[];
                    storeServiceAreas: ({
                        serviceArea: {
                            centerLat: number;
                            centerLng: number;
                            radiusKm: number;
                        };
                    } & {
                        id: string;
                        storeId: string;
                        serviceAreaId: string;
                    })[];
                    deliveryAreas: {
                        deliveryFee: import("@prisma/client/runtime/library").Decimal | null;
                        isActive: boolean;
                        pincode: string;
                        priority: number;
                        minimumOrder: import("@prisma/client/runtime/library").Decimal | null;
                        estimatedMinutes: number | null;
                    }[];
                } & {
                    phone: string | null;
                    email: string | null;
                    id: string;
                    status: import("@prisma/client").$Enums.StoreStatus;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    description: string | null;
                    deliveryFee: import("@prisma/client/runtime/library").Decimal;
                    minOrderAmount: import("@prisma/client/runtime/library").Decimal;
                    isActive: boolean;
                    ratingAvg: number;
                    ratingCount: number;
                    latitude: number;
                    longitude: number;
                    submittedAt: Date | null;
                    rejectionReason: string | null;
                    merchantProfileId: string;
                    cityId: string;
                    slug: string;
                    logoUrl: string | null;
                    bannerUrl: string | null;
                    line1: string;
                    line2: string | null;
                    pincode: string;
                    locality: string | null;
                    locationPincodeId: string | null;
                    locationAreaId: string | null;
                    locationCityId: string | null;
                    deliveryRadiusKm: number;
                    storeType: import("@prisma/client").$Enums.StoreType;
                    reviewedAt: Date | null;
                    reviewedBy: string | null;
                    rejectionType: import("@prisma/client").$Enums.RejectionType | null;
                    rejectionRevokedAt: Date | null;
                    rejectionRevokedBy: string | null;
                    rejectionRevokeReason: string | null;
                    documentRequestReason: string | null;
                    documentRequestAt: Date | null;
                    documentRequestBy: string | null;
                    requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
                    avgPrepTimeMins: number;
                    reputationStats: import("@prisma/client/runtime/library").JsonValue | null;
                }) | undefined;
                type: "menu_item";
            }[];
            restaurants: {
                type: "restaurant";
                hours: {
                    id: string;
                    storeId: string;
                    dayOfWeek: import("@prisma/client").$Enums.DayOfWeek;
                    openTime: string;
                    closeTime: string;
                    isClosed: boolean;
                }[];
                storeServiceAreas: ({
                    serviceArea: {
                        centerLat: number;
                        centerLng: number;
                        radiusKm: number;
                    };
                } & {
                    id: string;
                    storeId: string;
                    serviceAreaId: string;
                })[];
                deliveryAreas: {
                    deliveryFee: import("@prisma/client/runtime/library").Decimal | null;
                    isActive: boolean;
                    pincode: string;
                    priority: number;
                    minimumOrder: import("@prisma/client/runtime/library").Decimal | null;
                    estimatedMinutes: number | null;
                }[];
                phone: string | null;
                email: string | null;
                id: string;
                status: import("@prisma/client").$Enums.StoreStatus;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                deliveryFee: import("@prisma/client/runtime/library").Decimal;
                minOrderAmount: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                ratingAvg: number;
                ratingCount: number;
                latitude: number;
                longitude: number;
                submittedAt: Date | null;
                rejectionReason: string | null;
                merchantProfileId: string;
                cityId: string;
                slug: string;
                logoUrl: string | null;
                bannerUrl: string | null;
                line1: string;
                line2: string | null;
                pincode: string;
                locality: string | null;
                locationPincodeId: string | null;
                locationAreaId: string | null;
                locationCityId: string | null;
                deliveryRadiusKm: number;
                storeType: import("@prisma/client").$Enums.StoreType;
                reviewedAt: Date | null;
                reviewedBy: string | null;
                rejectionType: import("@prisma/client").$Enums.RejectionType | null;
                rejectionRevokedAt: Date | null;
                rejectionRevokedBy: string | null;
                rejectionRevokeReason: string | null;
                documentRequestReason: string | null;
                documentRequestAt: Date | null;
                documentRequestBy: string | null;
                requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
                avgPrepTimeMins: number;
                reputationStats: import("@prisma/client/runtime/library").JsonValue | null;
            }[];
            meta: {
                page: number;
                limit: number;
                totalProducts: number;
                totalPages: number;
                sort: import("./dto/search-discovery.dto").SearchSort;
                tab: import("./dto/search-discovery.dto").SearchTab;
            };
        };
    }>;
    suggestions(dto: SearchSuggestionsDto): Promise<{
        success: boolean;
        data: {
            popularSearches: string[];
            products: {
                id: string;
                name: string;
                slug: string;
                brand: string | null;
                imageUrls: string[];
            }[];
            categories: {
                id: string;
                name: string;
                slug: string;
                imageUrl: string | null;
            }[];
            stores: {
                id: string;
                name: string;
                slug: string;
                logoUrl: string | null;
            }[];
        };
    }>;
    trending(dto: SearchTrendingDto): Promise<{
        success: boolean;
        data: {
            period: "30d" | "7d" | "24h";
            trending: {
                query: string;
                score: number;
            }[];
        };
    }>;
    trackAnonymousEvent(dto: TrackSearchEventDto): {
        success: boolean;
    };
    trackBuyerEvent(user: RequestUser, dto: TrackSearchEventDto): Promise<{
        success: boolean;
    }>;
}
export declare class BuyerDiscoverController {
    private readonly discovery;
    constructor(discovery: SearchDiscoveryService);
    discoverStores(dto: DiscoverStoresSearchDto): Promise<{
        success: boolean;
        data: {
            stores: {
                store: import("../buyer/buyer-store.service").StoreCard;
                distance: number;
                eta: number;
                rating: number;
                offers: string[];
                categories: {
                    id: string;
                    name: string;
                }[];
            }[];
            total: number;
            filter: import("./dto/search-discovery.dto").DiscoverStoreFilter;
        };
    }>;
    discoverHome(dto: DiscoverHomeDto): Promise<{
        success: boolean;
        data: {
            trendingCategories: {
                id: string;
                name: string;
                slug: string;
                imageUrl: string | null;
                count: number;
            }[];
            popularNearYou: {
                store: import("../buyer/buyer-store.service").StoreCard;
                distance: number;
                eta: number;
                rating: number;
                offers: string[];
                categories: {
                    id: string;
                    name: string;
                }[];
            }[];
            fastDelivery: {
                store: import("../buyer/buyer-store.service").StoreCard;
                distance: number;
                eta: number;
                rating: number;
                offers: string[];
                categories: {
                    id: string;
                    name: string;
                }[];
            }[];
            topRatedStores: {
                store: import("../buyer/buyer-store.service").StoreCard;
                distance: number;
                eta: number;
                rating: number;
                offers: string[];
                categories: {
                    id: string;
                    name: string;
                }[];
            }[];
            dealsNearYou: {
                store: import("../buyer/buyer-store.service").StoreCard;
                distance: number;
                eta: number;
                rating: number;
                offers: string[];
                categories: {
                    id: string;
                    name: string;
                }[];
            }[];
            recommendedForYou: {
                id: string;
                name: string;
                slug: string;
                brand: string | null;
                imageUrls: string[];
                basePrice: number;
                mrp: number | null;
                variantId: string;
                category: {
                    id: string;
                    name: string;
                    slug: string;
                } | null;
                store: {
                    id: string;
                    name: string;
                    slug: string;
                    distanceKm: number | undefined;
                    ratingAvg: number;
                    avgPrepTimeMins: number;
                    etaMins: number;
                    hasOffer: boolean;
                };
                inStock: boolean;
                availableQty: number;
                score: number;
                sortPrice: number;
                sortEta: number;
                sortRating: number;
                sortDistance: number;
            }[] | {
                store: import("../buyer/buyer-store.service").StoreCard;
                distance: number;
                eta: number;
                rating: number;
                offers: string[];
                categories: {
                    id: string;
                    name: string;
                }[];
            }[];
            sponsoredBanner: {
                title: string;
                stores: {
                    sponsored: boolean;
                    campaignId: string;
                    priority: number;
                    id: string;
                    name: string;
                    slug: string;
                    logoUrl: string | null;
                }[];
            };
            featuredStore: {
                sponsored: boolean;
                campaignId: string;
                priority: number;
                id: string;
                name: string;
                slug: string;
                logoUrl: string | null;
            };
            sponsoredProducts: {
                sponsored: boolean;
                campaignId: string;
                id: string;
                name: string;
                storeId: string;
                slug: string;
                imageUrls: string[];
                basePrice: import("@prisma/client/runtime/library").Decimal;
            }[];
        };
    }>;
}
