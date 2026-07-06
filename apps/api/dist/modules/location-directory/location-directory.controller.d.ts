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
            states: any;
            districts: any;
            cities: any;
        };
    }>;
    byPincode(pincode: string): Promise<{
        success: boolean;
        data: any;
    }>;
    bySlug(slug: string): Promise<{
        success: boolean;
        data: import("./location-directory.service").LocationSearchResult;
    }>;
}
