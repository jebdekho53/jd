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
        territory: {
            city: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            state: string;
            pincodes: string[];
            country: string;
            franchiseId: string;
            exclusivityEnabled: boolean;
            launchDate: Date | null;
        };
        conflicts: {
            id: string;
            status: import("@prisma/client").$Enums.TerritoryConflictStatus;
            createdAt: Date;
            resolvedAt: Date | null;
            resolution: string | null;
            pincode: string;
            franchiseId: string;
            primaryTerritoryId: string;
            conflictingTerritoryId: string;
        }[];
    }>;
    detectOverlap(territoryId: string, franchiseId: string, pincodes: string[], exclusivityEnabled: boolean): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TerritoryConflictStatus;
        createdAt: Date;
        resolvedAt: Date | null;
        resolution: string | null;
        pincode: string;
        franchiseId: string;
        primaryTerritoryId: string;
        conflictingTerritoryId: string;
    }[]>;
    listConflicts(): Promise<({
        franchise: {
            businessName: string;
        };
        primaryTerritory: {
            city: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            state: string;
            pincodes: string[];
            country: string;
            franchiseId: string;
            exclusivityEnabled: boolean;
            launchDate: Date | null;
        };
        conflictingTerritory: {
            franchise: {
                businessName: string;
            };
        } & {
            city: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            state: string;
            pincodes: string[];
            country: string;
            franchiseId: string;
            exclusivityEnabled: boolean;
            launchDate: Date | null;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TerritoryConflictStatus;
        createdAt: Date;
        resolvedAt: Date | null;
        resolution: string | null;
        pincode: string;
        franchiseId: string;
        primaryTerritoryId: string;
        conflictingTerritoryId: string;
    })[]>;
    getTerritoriesForMap(): Promise<({
        franchise: {
            id: string;
            businessName: string;
        };
    } & {
        city: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        state: string;
        pincodes: string[];
        country: string;
        franchiseId: string;
        exclusivityEnabled: boolean;
        launchDate: Date | null;
    })[]>;
}
