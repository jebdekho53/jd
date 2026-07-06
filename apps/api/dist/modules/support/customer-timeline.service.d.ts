import { PrismaService } from '../../database/prisma.service';
export declare class CustomerTimelineService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getTimeline(userId: string): Promise<{
        events: any[];
    }>;
    getTimelineForTicket(ticketId: string): Promise<{
        events: any[];
    }>;
}
