import { PrismaService } from '../../database/prisma.service';
import { BuyerStoreService } from '../buyer/buyer-store.service';
import { SearchCacheService } from './search-cache.service';
import { SearchAnalyticsService } from './search-analytics.service';
import { AdServingService } from '../ads/ad-serving.service';
import { SeoAnalyticsService } from '../seo/seo-analytics.service';
import type { BuyerSearchDto, DiscoverHomeDto, DiscoverStoresSearchDto, SearchSort, SearchSuggestionsDto, SearchTrendingDto } from './dto/search-discovery.dto';
export declare class SearchDiscoveryService {
    private readonly prisma;
    private readonly storeService;
    private readonly cache;
    private readonly analytics;
    private readonly adServing;
    private readonly seoAnalytics;
    private readonly logger;
    constructor(prisma: PrismaService, storeService: BuyerStoreService, cache: SearchCacheService, analytics: SearchAnalyticsService, adServing: AdServingService, seoAnalytics: SeoAnalyticsService);
    unifiedSearch(dto: BuyerSearchDto): Promise<{
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
            sort: SearchSort;
            tab: import("./dto/search-discovery.dto").SearchTab;
        };
    }>;
    suggestions(dto: SearchSuggestionsDto): Promise<{
        popularSearches: any;
        products: any;
        categories: any;
        stores: any;
    }>;
    trending(dto: SearchTrendingDto): Promise<{
        period: "30d" | "7d" | "24h";
        trending: {
            query: string;
            score: number;
        }[];
    }>;
    discoverStores(dto: DiscoverStoresSearchDto): Promise<{
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
    }>;
    discoverHome(dto: DiscoverHomeDto): Promise<{
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
    }>;
    recommendations(dto: DiscoverHomeDto): Promise<{
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
    }[]>;
    private homeTrendingCategories;
    private sortProducts;
    private productDistance;
    private isStoreEligibleForSearch;
    private fetchProductCandidates;
    private fetchStoreCandidates;
    private fetchCategoryCandidates;
    private fetchBrandCandidates;
    private fetchMenuItemCandidates;
    private fetchRestaurantCandidates;
    private activeOfferStoreIds;
    private storeOffersMap;
    private storeCategoriesMap;
    private periodSince;
    private emptySearchResult;
}
