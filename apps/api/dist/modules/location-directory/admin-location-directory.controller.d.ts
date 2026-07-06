import { Response } from 'express';
import { LocationDirectoryService } from './location-directory.service';
import { ImportLocationsDto, ListAdminLocationsDto, SetLocationActiveDto } from './dto/location-directory.dto';
export declare class AdminLocationDirectoryController {
    private readonly locations;
    constructor(locations: LocationDirectoryService);
    list(query: ListAdminLocationsDto): Promise<{
        success: boolean;
        data: {
            total: any;
            page: number;
            limit: number;
            items: any;
        };
    }>;
    stats(): Promise<{
        success: boolean;
        data: {
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
