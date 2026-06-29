import { GeocodingCacheService } from './geocoding-cache.service';
export declare class GeocodingController {
    private readonly geocoding;
    constructor(geocoding: GeocodingCacheService);
    reverse(latRaw: string, lngRaw: string): Promise<{
        success: boolean;
        data: import("./geocoding-cache.service").GeocodedAddress | null;
    }>;
    byPincode(pincode: string): Promise<{
        success: boolean;
        data: import("./geocoding-cache.service").GeocodedAddress | null;
    }>;
}
