import { AddressLabel } from '@prisma/client';
export declare class MapStoresQueryDto {
    lat: number;
    lng: number;
    radiusKm?: number;
}
export declare class CheckDeliverabilityDto {
    storeId: string;
    lat: number;
    lng: number;
    pincode?: string;
}
export declare class UpdateStoreRadiusDto {
    deliveryRadiusKm: number;
    locality?: string;
}
export declare class CreateAddressDto {
    label?: AddressLabel;
    line1: string;
    line2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    locationCityId?: string;
    locationAreaId?: string;
    locationPincodeId?: string;
    isDefault?: boolean;
}
export declare class UpdateAddressDto {
    label?: AddressLabel;
    line1?: string;
    line2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    locationCityId?: string;
    locationAreaId?: string;
    locationPincodeId?: string;
    isDefault?: boolean;
}
