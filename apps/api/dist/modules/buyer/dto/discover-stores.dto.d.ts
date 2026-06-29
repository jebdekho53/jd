export type StoreDiscoverySort = 'distance' | 'popular' | 'fast' | 'new' | 'rating';
export declare class DiscoverStoresDto {
    lat: number;
    lng: number;
    pincode?: string;
    radiusKm?: number;
    page?: number;
    limit?: number;
    sort?: StoreDiscoverySort;
}
