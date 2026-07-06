import { DeliveryRegion } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export interface LocationSearchResult {
    id: string;
    label: string;
    slug: string;
    type: 'pincode' | 'area' | 'city' | 'alias';
    pincode?: string;
    postOffice?: string;
    city: string;
    citySlug: string;
    area?: string;
    areaSlug?: string;
    district: string;
    state: string;
    latitude: number;
    longitude: number;
    deliveryRegion: DeliveryRegion;
    locationPincodeId?: string;
    locationAreaId?: string;
    locationCityId?: string;
}
export interface ResolvedPincodeLocation {
    inMasterDirectory: boolean;
    pincode: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    locality?: string;
    locationPincodeId?: string;
    locationAreaId?: string;
    locationCityId?: string;
    operationalCityId?: string;
}
export declare class LocationDirectoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    search(params: {
        q: string;
        cityId?: string;
        districtId?: string;
        pincode?: string;
        limit?: number;
    }): Promise<LocationSearchResult[]>;
    private pickPincodeRow;
    tryResolvePincode(params: {
        pincode: string;
        locationCityId?: string;
        locationAreaId?: string;
        latitude?: number;
        longitude?: number;
    }): Promise<ResolvedPincodeLocation>;
    getByPincode(pincode: string): Promise<any>;
    getBySlug(slug: string): Promise<LocationSearchResult>;
    validatePincode(params: {
        pincode: string;
        locationCityId?: string;
        locationAreaId?: string;
    }): Promise<LocationSearchResult>;
    listFilters(): Promise<{
        states: any;
        districts: any;
        cities: any;
    }>;
    adminList(params: {
        q?: string;
        cityId?: string;
        districtId?: string;
        pincode?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        total: any;
        page: number;
        limit: number;
        items: any;
    }>;
    adminStats(): Promise<{
        totals: {
            states: any;
            districts: any;
            cities: any;
            areas: any;
            pincodes: any;
            aliases: any;
            activePincodes: any;
        };
        regions: any;
        cityBreakdown: any;
    }>;
    setPincodeActive(id: string, isActive: boolean): Promise<LocationSearchResult>;
    exportCsv(): Promise<string>;
    importCsv(csv: string): Promise<{
        imported: number;
    }>;
    private serializePincode;
}
