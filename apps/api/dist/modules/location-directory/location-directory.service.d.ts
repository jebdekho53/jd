import { DeliveryRegion, Prisma } from '@prisma/client';
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
    tryResolvePincode(params: {
        pincode: string;
        locationCityId?: string;
        locationAreaId?: string;
    }): Promise<ResolvedPincodeLocation>;
    getByPincode(pincode: string): Promise<LocationSearchResult[]>;
    getBySlug(slug: string): Promise<LocationSearchResult>;
    validatePincode(params: {
        pincode: string;
        locationCityId?: string;
        locationAreaId?: string;
    }): Promise<LocationSearchResult>;
    listFilters(): Promise<{
        states: {
            id: string;
            name: string;
            code: string;
            slug: string;
        }[];
        districts: {
            id: string;
            name: string;
            slug: string;
            stateId: string;
        }[];
        cities: {
            id: string;
            name: string;
            slug: string;
            stateId: string;
            districtId: string;
        }[];
    }>;
    adminList(params: {
        q?: string;
        cityId?: string;
        districtId?: string;
        pincode?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        total: number;
        page: number;
        limit: number;
        items: {
            isActive: boolean;
            id: string;
            label: string;
            slug: string;
            type: "pincode" | "area" | "city" | "alias";
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
        }[];
    }>;
    adminStats(): Promise<{
        totals: {
            states: number;
            districts: number;
            cities: number;
            areas: number;
            pincodes: number;
            aliases: number;
            activePincodes: number;
        };
        regions: (Prisma.PickEnumerable<Prisma.LocationCityGroupByOutputType, "deliveryRegion"[]> & {
            _count: {
                _all: number;
            };
        })[];
        cityBreakdown: {
            id: string;
            name: string;
            _count: {
                pincodes: number;
                areas: number;
            };
            slug: string;
        }[];
    }>;
    setPincodeActive(id: string, isActive: boolean): Promise<LocationSearchResult>;
    exportCsv(): Promise<string>;
    importCsv(csv: string): Promise<{
        imported: number;
    }>;
    private serializePincode;
}
