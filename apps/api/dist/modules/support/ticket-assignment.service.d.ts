import { SupportActorType, SupportTeam } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class TicketAssignmentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    resolveTeam(categoryCode: string, actorType: SupportActorType): SupportTeam;
    assignTicket(ticketId: string, team: SupportTeam, assignedBy?: string): Promise<any>;
}
