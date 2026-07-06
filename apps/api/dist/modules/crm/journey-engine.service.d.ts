import { PrismaService } from '../../database/prisma.service';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
export declare class JourneyEngineService {
    private readonly prisma;
    private readonly notifications;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationOrchestratorService);
    listJourneys(): Promise<any>;
    enrollUser(journeyCode: string, userId: string): Promise<any>;
    processScheduledSteps(): Promise<void>;
}
