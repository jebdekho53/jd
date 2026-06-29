import { LocationDirectoryService } from './location-directory.service';
import { SearchLocationsDto } from './dto/location-directory.dto';
export declare class LocationDirectoryController {
    private readonly locations;
    constructor(locations: LocationDirectoryService);
    search(query: SearchLocationsDto): Promise<{
        success: boolean;
        data: import("./location-directory.service").LocationSearchResult[];
    }>;
    filters(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    byPincode(pincode: string): Promise<{
        success: boolean;
        data: import("./location-directory.service").LocationSearchResult[];
    }>;
    bySlug(slug: string): Promise<{
        success: boolean;
        data: import("./location-directory.service").LocationSearchResult;
    }>;
}
