import { PrismaService } from '../../database/prisma.service';
import { JourneyEngineService } from './journey-engine.service';
import { MarketingEventService } from './marketing-event.service';
export declare class CartRecoveryService {
    private readonly prisma;
    private readonly journeys;
    private readonly events;
    private readonly logger;
    constructor(prisma: PrismaService, journeys: JourneyEngineService, events: MarketingEventService);
    processAbandonedCarts(): Promise<void>;
}
