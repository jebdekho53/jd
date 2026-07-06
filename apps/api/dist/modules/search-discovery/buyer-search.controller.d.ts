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
                score: number;
                sortPrice: number;
                sortEta: number;
                sortRating: number;
                sortDistance: number;
            }[];
            stores: any;
            categories: any;
            subcategories: any;
            brands: any;
            menuItems: any;
            restaurants: any;
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
            popularSearches: any;
            products: any;
            categories: any;
            stores: any;
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
                stores: any;
            };
            featuredStore: any;
            sponsoredProducts: any;
        };
    }>;
}
