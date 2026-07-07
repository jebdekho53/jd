import { RequestUser } from '../../common/types/index';
import { GeospatialService } from './geospatial.service';
import { UpdateStoreRadiusDto } from './dto/geospatial.dto';
export declare class AdminStoreGeoController {
    private readonly geo;
    constructor(geo: GeospatialService);
    updateRadius(user: RequestUser, storeId: string, dto: UpdateStoreRadiusDto): Promise<{
        success: boolean;
        data: {
            updatedBy: string;
            id: string;
            name: string;
            latitude: number;
            longitude: number;
            slug: string;
            locality: string | null;
            deliveryRadiusKm: number;
        };
    }>;
}
