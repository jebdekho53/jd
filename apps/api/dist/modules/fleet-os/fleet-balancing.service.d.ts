import { PrismaService } from '../../database/prisma.service';
export declare class FleetBalancingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getBalanceSuggestions(): Promise<{
        from: {
            city: string;
            locality: string;
            riders: number;
        };
        to: {
            city: string;
            locality: string;
            orders: number;
        };
        ridersToMove: number;
    }[]>;
    countOnlineRiders(): Promise<number>;
}
