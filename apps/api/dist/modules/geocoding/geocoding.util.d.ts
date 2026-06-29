import type { GeocodedAddress } from './geocoding-cache.service';
interface GoogleGeocodeResponse {
    status?: string;
    results?: Array<{
        formatted_address?: string;
        types?: string[];
        address_components?: Array<{
            long_name: string;
            short_name: string;
            types: string[];
        }>;
        geometry?: {
            location?: {
                lat?: number;
                lng?: number;
            };
        };
    }>;
}
export declare function parseGeocoderResponse(data: GoogleGeocodeResponse, fallbackLat: number, fallbackLng: number): GeocodedAddress | null;
export {};
