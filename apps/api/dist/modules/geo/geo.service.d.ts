import { PrismaService } from '../../database/prisma.service';
export declare class GeoService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findOrCreateOperationalCity(params: {
        name: string;
        state: string;
        latitude: number;
        longitude: number;
    }): Promise<any>;
    listCities(): Promise<any>;
    listZonesByCity(cityId: string): Promise<any>;
}
