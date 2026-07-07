import { Response } from 'express';
import { LocationDirectoryService } from './location-directory.service';
import { ImportLocationsDto, ListAdminLocationsDto, SetLocationActiveDto } from './dto/location-directory.dto';
export declare class AdminLocationDirectoryController {
    private readonly locations;
    constructor(locations: LocationDirectoryService);
    list(query: ListAdminLocationsDto): Promise<{
        success: boolean;
        data: {
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
                deliveryRegion: import("@prisma/client").DeliveryRegion;
                locationPincodeId?: string;
                locationAreaId?: string;
                locationCityId?: string;
            }[];
        };
    }>;
    stats(): Promise<{
        success: boolean;
        data: {
            totals: {
                states: number;
                districts: number;
                cities: number;
                areas: number;
                pincodes: number;
                aliases: number;
                activePincodes: number;
            };
            regions: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.LocationCityGroupByOutputType, "deliveryRegion"[]> & {
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
        };
    }>;
    export(res: Response): Promise<void>;
    import(body: ImportLocationsDto): Promise<{
        success: boolean;
        data: {
            imported: number;
        };
    }>;
    setActive(id: string, body: SetLocationActiveDto): Promise<{
        success: boolean;
        data: import("./location-directory.service").LocationSearchResult;
    }>;
}
