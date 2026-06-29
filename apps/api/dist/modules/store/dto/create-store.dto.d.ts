import { StoreHourDto } from './store-hours.dto';
export declare class CreateStoreDto {
    name: string;
    description?: string;
    phone: string;
    email: string;
    line1: string;
    line2?: string;
    pincode: string;
    latitude: number;
    longitude: number;
    cityId: string;
    locationCityId?: string;
    locationAreaId?: string;
    locationPincodeId?: string;
    logoUrl: string;
    bannerUrl: string;
    minOrderAmount?: number;
    deliveryFee?: number;
    avgPrepTimeMins?: number;
    zoneIds?: string[];
    serviceAreaIds?: string[];
    hours?: StoreHourDto[];
    deliveryCoveragePincodes?: string[];
}
