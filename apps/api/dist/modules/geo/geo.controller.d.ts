import { GeoService } from './geo.service';
export declare class GeoController {
    private readonly geoService;
    constructor(geoService: GeoService);
    listCities(): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            state: string;
            slug: string;
            country: string;
        }[];
    }>;
    listZones(cityId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            slug: string;
        }[];
    }>;
}
