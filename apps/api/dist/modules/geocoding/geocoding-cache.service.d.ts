import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
export interface GeocodedAddress {
    formattedAddress: string;
    line1: string;
    line2?: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    lat: number;
    lng: number;
}
export declare class GeocodingCacheService {
    private readonly redis;
    private readonly logger;
    private readonly apiKey;
    constructor(redis: RedisService, config: ConfigService);
    isConfigured(): boolean;
    private roundCoord;
    private reverseKey;
    private pincodeKey;
    reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress | null>;
    getByPincode(pincode: string): Promise<GeocodedAddress | null>;
}
