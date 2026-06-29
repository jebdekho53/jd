import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
export declare class FleetAlertService {
    private readonly prisma;
    private readonly events;
    private readonly logger;
    constructor(prisma: PrismaService, events: EventEmitter2);
    scanAndCreateAlerts(): Promise<{
        city: string | null;
        message: string;
        id: string;
        status: import("@prisma/client").$Enums.FleetAlertStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        resolvedAt: Date | null;
        alertType: import("@prisma/client").$Enums.FleetAlertType;
        riderProfileId: string | null;
        locality: string | null;
    }[]>;
    listOpenAlerts(): Promise<{
        city: string | null;
        message: string;
        id: string;
        status: import("@prisma/client").$Enums.FleetAlertStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        resolvedAt: Date | null;
        alertType: import("@prisma/client").$Enums.FleetAlertType;
        riderProfileId: string | null;
        locality: string | null;
    }[]>;
    private createAlert;
}
