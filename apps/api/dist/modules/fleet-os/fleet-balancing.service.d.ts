import { PrismaService } from '../../database/prisma.service';
export declare class FleetBalancingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getBalanceSuggestions(): Promise<{
        from: {
            city: any;
            locality: any;
            riders: any;
        };
        to: {
            city: any;
            locality: any;
            orders: any;
        };
        ridersToMove: number;
    }[]>;
    countOnlineRiders(): Promise<any>;
}
