import { PrismaService } from '../../database/prisma.service';
export declare class TerritoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    assignTerritory(franchiseId: string, input: {
        city: string;
        state: string;
        pincodes: string[];
        exclusivityEnabled?: boolean;
        launchDate?: Date;
    }, actorId?: string): Promise<{
        territory: any;
        conflicts: any[];
    }>;
    detectOverlap(territoryId: string, franchiseId: string, pincodes: string[], exclusivityEnabled: boolean): Promise<any[]>;
    listConflicts(): Promise<any>;
    getTerritoriesForMap(): Promise<any>;
}
