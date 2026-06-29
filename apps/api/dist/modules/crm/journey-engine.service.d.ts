import { PrismaService } from '../../database/prisma.service';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
export declare class JourneyEngineService {
    private readonly prisma;
    private readonly notifications;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationOrchestratorService);
    listJourneys(): Promise<({
        steps: {
            id: string;
            name: string;
            createdAt: Date;
            templateCode: string | null;
            channel: import("@prisma/client").$Enums.NotificationChannel;
            journeyId: string;
            stepOrder: number;
            delayMinutes: number;
            actionConfig: import("@prisma/client/runtime/library").JsonValue;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.JourneyStatus;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        code: string;
        isActive: boolean;
        trigger: import("@prisma/client").$Enums.AutomationTrigger;
    })[]>;
    enrollUser(journeyCode: string, userId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.CustomerJourneyStatus;
        userId: string;
        completedAt: Date | null;
        journeyId: string;
        currentStep: number;
        enteredAt: Date;
        exitedAt: Date | null;
    } | null>;
    processScheduledSteps(): Promise<void>;
}
