import { PrismaService } from '../../database/prisma.service';
export declare class GeoService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findOrCreateOperationalCity(params: {
        name: string;
        state: string;
        latitude: number;
        longitude: number;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        state: string;
        isActive: boolean;
        latitude: number;
        longitude: number;
        slug: string;
        country: string;
        timezone: string;
    }>;
    listCities(): Promise<{
        id: string;
        name: string;
        state: string;
        slug: string;
        country: string;
    }[]>;
    listZonesByCity(cityId: string): Promise<{
        id: string;
        name: string;
        slug: string;
    }[]>;
}
