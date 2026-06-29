export type SearchSort = 'relevance' | 'distance' | 'price_low_high' | 'price_high_low' | 'rating' | 'fastest_delivery';
export type SearchTab = 'all' | 'products' | 'stores' | 'categories' | 'menu_items' | 'restaurants';
export declare class BuyerSearchDto {
    q?: string;
    lat?: number;
    lng?: number;
    pincode?: string;
    categoryId?: string;
    subcategoryId?: string;
    storeId?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: SearchSort;
    tab?: SearchTab;
    page?: number;
    limit?: number;
    sessionId?: string;
    buyerProfileId?: string;
}
export declare class SearchSuggestionsDto {
    q: string;
    lat?: number;
    lng?: number;
}
export declare class SearchTrendingDto {
    period?: '24h' | '7d' | '30d';
    lat?: number;
    lng?: number;
}
export type DiscoverStoreFilter = 'nearest' | 'best_rated' | 'fast_delivery' | 'offers' | 'new_stores';
export declare class DiscoverStoresSearchDto {
    lat: number;
    lng: number;
    radiusKm?: number;
    pincode?: string;
    filter?: DiscoverStoreFilter;
    page?: number;
    limit?: number;
}
export declare class DiscoverHomeDto {
    lat: number;
    lng: number;
    buyerProfileId?: string;
}
export declare class TrackSearchEventDto {
    eventType: 'QUERY' | 'CLICK' | 'ADD_TO_CART' | 'STORE_CLICK' | 'IMPRESSION';
    query?: string;
    productId?: string;
    storeId?: string;
    categoryId?: string;
    sessionId?: string;
    buyerProfileId?: string;
}
