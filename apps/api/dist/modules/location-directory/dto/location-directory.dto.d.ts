export declare class SearchLocationsDto {
    q: string;
    cityId?: string;
    districtId?: string;
    pincode?: string;
    limit?: number;
}
export declare class ListAdminLocationsDto {
    q?: string;
    cityId?: string;
    districtId?: string;
    pincode?: string;
    page?: number;
    limit?: number;
}
export declare class ValidatePincodeDto {
    pincode: string;
    locationCityId?: string;
    locationAreaId?: string;
}
export declare class SetLocationActiveDto {
    isActive: boolean;
}
export declare class ImportLocationsDto {
    csv: string;
}
